import ExcelJS from 'exceljs';
import { nowJalali } from './jalali';

export const exportConsultationsToExcel = async (snapshot: any[], activeCount: number) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Novin Tech';
  wb.created = new Date();

  const ws = wb.addWorksheet('مشاوره های کارشناس', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }],
    properties: { defaultRowHeight: 25, showGridLines: false },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true }
  });

  ws.columns = [
    { key: 'index', width: 8 },
    { key: 'phone', width: 20 },
    { key: 'name', width: 30 },
    { key: 'course', width: 30 },
    { key: 'advisoryDate', width: 20 },
    { key: 'advisoryTime', width: 20 },
  ];

  // Row 1: Title
  ws.mergeCells('A1:F1');
  const titleRow = ws.getRow(1);
  titleRow.height = 40;
  const titleCell = ws.getCell('A1');
  titleCell.value = 'گزارش مشاوره‌های کارشناس نوین تک';
  titleCell.font = { name: 'Vazirmatn', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } }; // Violet

  // Row 2: Metadata
  ws.mergeCells('A2:F2');
  const metaRow = ws.getRow(2);
  metaRow.height = 30;
  const metaCell = ws.getCell('A2');
  metaCell.value = `تاریخ خروجی: ${nowJalali()}   |   تعداد مشاوره‌ها: ${activeCount}`;
  metaCell.font = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: 'FF4C1D95' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };

  // Row 3: Blank spacer
  ws.getRow(3).height = 15;

  // Row 4: Headers
  const headerRow = ws.getRow(4);
  headerRow.height = 35;
  const headers = [
    'ردیف', 'شماره تماس', 'نام شخص', 'دوره مدنظر',
    'تاریخ مراجعه', 'ساعت مراجعه'
  ];
  headerRow.values = headers;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  ws.autoFilter = `A4:F${4 + Math.max(1, snapshot.length)}`;

  snapshot.forEach((c, index) => {
    const rowData = [
      index + 1,
      c.phone ? String(c.phone) : '',
      c.fullName || '',
      c.interestedCourse || '',
      c.advisoryDate ? new Date(c.advisoryDate).toLocaleDateString('fa-IR') : '',
      c.advisoryTime || ''
    ];

    const row = ws.addRow(rowData);

    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.font = { name: 'Vazirmatn', size: 10, color: { argb: 'FF334155' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Striping
      if (index % 2 !== 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `مشاوره‌های_کارشناس_${nowJalali().replace(/\//g, '-')}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
