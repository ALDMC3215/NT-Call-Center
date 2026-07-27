import ExcelJS from 'exceljs';
import { nowJalali } from './jalali';

export const exportConsultationsToExcel = async (snapshot: any[], activeCount: number, historyStats?: Array<{jalali_date: string, call_count: number}>, todayCount?: number) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Novin Tech';
  wb.created = new Date();

  const ws = wb.addWorksheet('تماس‌های کارشناس', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }],
    properties: { defaultRowHeight: 25, showGridLines: false },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true }
  });

  ws.columns = [
    { key: 'index', width: 8 },
    { key: 'phone', width: 20 },
    { key: 'name', width: 30 },
    { key: 'course', width: 30 },
    { key: 'result', width: 25 },
    { key: 'note', width: 35 },
  ];

  // Row 1: Title
  ws.mergeCells('A1:F1');
  const titleRow = ws.getRow(1);
  titleRow.height = 40;
  const titleCell = ws.getCell('A1');
  titleCell.value = 'گزارش تماس‌های روزانه کارشناس نوین تک';
  titleCell.font = { name: 'Vazirmatn', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } }; // Violet

  // Row 2: Metadata
  ws.mergeCells('A2:F2');
  const metaRow = ws.getRow(2);
  metaRow.height = 30;
  const metaCell = ws.getCell('A2');
  metaCell.value = `تاریخ خروجی: ${nowJalali()}   |   تعداد تماس‌ها: ${activeCount}`;
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
    'وضعیت تماس', 'یادداشت'
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
      c.course || '',
      c.callStatus || '',
      c.notes || ''
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

  if (historyStats && todayCount !== undefined) {
    const ws2 = wb.addWorksheet('آمار روزانه', {
      views: [{ rightToLeft: true }],
      properties: { defaultRowHeight: 25, showGridLines: false }
    });

    ws2.columns = [
      { key: 'date', width: 25 },
      { key: 'count', width: 25 }
    ];

    ws2.mergeCells('A1:B1');
    const tRow = ws2.getRow(1);
    tRow.height = 35;
    const tCell = tRow.getCell(1);
    tCell.value = 'گزارش تماس‌های روزانه';
    tCell.font = { name: 'Vazirmatn', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
    tCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const todayRow = ws2.getRow(2);
    todayRow.height = 30;
    todayRow.getCell(1).value = `کار شده امروز (${nowJalali().split(' ')[0]})`;
    todayRow.getCell(2).value = todayCount;
    todayRow.eachCell(c => {
      c.font = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: 'FF0284C7' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      c.border = {
        top: { style: 'thin', color: { argb: 'FFBAE6FD' } },
        bottom: { style: 'thin', color: { argb: 'FFBAE6FD' } },
        left: { style: 'thin', color: { argb: 'FFBAE6FD' } },
        right: { style: 'thin', color: { argb: 'FFBAE6FD' } }
      };
    });

    ws2.getRow(3).height = 15;

    const hHeaderRow = ws2.getRow(4);
    hHeaderRow.height = 30;
    hHeaderRow.values = ['تاریخ', 'تعداد تماس‌های کارشناس'];
    hHeaderRow.eachCell(c => {
      c.font = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    [...historyStats].reverse().forEach((s, i) => {
       const row = ws2.addRow([s.jalali_date, s.call_count]);
       row.eachCell(c => {
         c.font = { name: 'Vazirmatn', size: 10, color: { argb: 'FF334155' } };
         c.alignment = { vertical: 'middle', horizontal: 'center' };
         c.border = {
           bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
           top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
           left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
           right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
         };
         if (i % 2 !== 0) {
           c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
         }
       });
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تماس‌های_کارشناس_${nowJalali().replace(/\//g, '-')}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
