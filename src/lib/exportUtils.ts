import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { NAAC_CRITERIA, User } from './constants';

export const exportToPDF = (teacher: User, criterionData: any[], files: any[]) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();
  const academicYear = "2023-24";
  const collegeName = "Institutional Accreditation Portal";

  // --- Cover Page ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 297, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("NAAC FACULTY REPORT", 105, 100, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(collegeName, 105, 120, { align: 'center' });
  
  doc.setDrawColor(59, 130, 246); // Blue 500
  doc.setLineWidth(2);
  doc.line(80, 130, 130, 130);
  
  doc.setFontSize(16);
  doc.text(`Faculty: ${teacher.name}`, 105, 150, { align: 'center' });
  doc.text(`Department: ${teacher.department}`, 105, 160, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Academic Year: ${academicYear}`, 105, 260, { align: 'center' });
  doc.text(`Export Date: ${date}`, 105, 265, { align: 'center' });

  // Add new page for content
  doc.addPage();
  doc.setTextColor(0, 0, 0);

  // --- Content ---
  NAAC_CRITERIA.forEach((criterion, index) => {
    if (index > 0) doc.addPage();
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${criterion.id}: ${criterion.title}`, 14, 20);
    
    const critData = criterionData.filter(d => d.criterionType === criterion.id);
    
    if (critData.length > 0) {
      const tableData: any[][] = [];
      critData.forEach(submission => {
        let formData: any = {};
        try { formData = JSON.parse(submission.data); } catch (e) {}
        
        criterion.fields.forEach(field => {
          let value = formData[field.id];
          if (field.type === 'file' && value) {
            value = typeof value === 'object' ? value.originalName : 'Document Attached';
          } else if (Array.isArray(value)) {
            value = value.join(', ');
          }
          tableData.push([field.label, value || '—', submission.status]);
        });
      });

      autoTable(doc, {
        startY: 30,
        head: [['Field Name', 'Value', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 }
      });
    } else {
      doc.setFontSize(12);
      doc.setFont("helvetica", "italic");
      doc.text("No data submitted for this criterion.", 14, 30);
    }
  });

  // --- Uploaded Documents ---
  doc.addPage();
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Supporting Documents Inventory", 14, 20);
  
  const fileRows = files.map(f => [
    f.originalName,
    f.criterionType,
    new Date(f.createdAt).toLocaleDateString(),
    f.status
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['File Name', 'Criterion', 'Upload Date', 'Status']],
    body: fileRows.length > 0 ? fileRows : [['No documents uploaded', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] }
  });

  // --- Final Summary ---
  doc.addPage();
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Consolidated Completion Summary", 14, 20);
  
  const summaryRows = NAAC_CRITERIA.map(c => {
    const data = criterionData.find(d => d.criterionType === c.id);
    return [c.id, c.title, data ? data.status : 'NOT STARTED', data ? new Date(data.updatedAt).toLocaleDateString() : '—'];
  });

  autoTable(doc, {
    startY: 30,
    head: [['ID', 'Criterion', 'Status', 'Last Activity']],
    body: summaryRows,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] }
  });

  // --- Add Footers (Page numbering) ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
    doc.text(`${collegeName} | AY ${academicYear} | Printed on: ${date}`, 14, 287);
  }

  doc.save(`${teacher.name.replace(/\s+/g, '_')}_NAAC_Report.pdf`);
};

export const exportToExcel = (teacher: User, criterionData: any[], files: any[]) => {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    ['Institutional NAAC Progress Summary'],
    [''],
    ['Faculty Name', teacher.name],
    ['Department', teacher.department],
    ['Export Date', new Date().toLocaleDateString()],
    ['Academic Year', '2023-24'],
    [''],
    ['Criterion', 'Status', 'Submissions', 'Last Updated']
  ];

  NAAC_CRITERIA.forEach(c => {
    const data = criterionData.find(d => d.criterionType === c.id);
    summaryData.push([
      `${c.id}: ${c.title}`,
      data ? data.status : 'NOT STARTED',
      data ? '1' : '0',
      data ? new Date(data.updatedAt).toLocaleDateString() : '—'
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Overall Summary');

  // 2. per Criterion Sheets
  NAAC_CRITERIA.forEach(criterion => {
    const submission = criterionData.find(d => d.criterionType === criterion.id);
    let formData: any = {};
    if (submission) {
      try { formData = JSON.parse(submission.data); } catch (e) {}
    }

    const rows = [
      [`${criterion.id}: ${criterion.title}`, '', '', ''],
      ['Field Name', 'Value', 'Supporting Document', 'Status']
    ];

    criterion.fields.forEach(field => {
      let value = formData[field.id];
      let docName = '—';

      if (field.type === 'file' && value) {
        docName = typeof value === 'object' ? value.originalName : 'Attached';
        value = 'Document Link Managed in Portal';
      } else if (Array.isArray(value)) {
        value = value.join(', ');
      }

      rows.push([
        field.label,
        value || '—',
        docName,
        submission ? submission.status : 'PENDING'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Field Name
      { wch: 40 }, // Value
      { wch: 30 }, // Document
      { wch: 15 }, // Status
    ];

    // Frozen header row (Row 2 is the header, Row 1 is merged title)
    // Actually standard for header is usually Row 2 if Row 1 is title
    ws['!views'] = [{ state: 'frozen', ySplit: 2 }];

    // Merging first row (Title)
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

    XLSX.utils.book_append_sheet(wb, ws, criterion.id);
  });

  // 3. Document List Sheet
  const docRows = [
    ['Uploaded Documents Inventory'],
    ['File Name', 'Criterion ID', 'Upload Date', 'Status']
  ];
  files.forEach(f => {
    docRows.push([
      f.originalName,
      f.criterionType,
      new Date(f.createdAt).toLocaleDateString(),
      f.status
    ]);
  });
  const wsDocs = XLSX.utils.aoa_to_sheet(docRows);
  XLSX.utils.book_append_sheet(wb, wsDocs, 'Documents');

  XLSX.writeFile(wb, `${teacher.name.replace(/\s+/g, '_')}_NAAC_Data.xlsx`);
};
