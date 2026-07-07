import ExcelJS from 'exceljs';
import { toJalali, nowJalali } from './jalali';

export const exportFollowupsToExcel = async (snapshot: any[], activeCount: number) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Novin Tech';
  wb.created = new Date();

  const ws = wb.addWorksheet('پیگیریهای فعال', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }],
    properties: { defaultRowHeight: 25, showGridLines: false },
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true }
  });

  ws.columns = [
    { key: 'index', width: 8 },
    { key: 'name', width: 22 },
    { key: 'phone', width: 16 },
    { key: 'status', width: 20 },
    { key: 'advisory', width: 15 },
    { key: 'isFollowUp', width: 15 },
    { key: 'notes', width: 45 },
    { key: 'lastAttempt', width: 20 },
  ];

  // Row 1: Title
  ws.mergeCells('A1:H1');
  const titleRow = ws.getRow(1);
  titleRow.height = 40;
  const titleCell = ws.getCell('A1');
  titleCell.value = 'گزارش پیگیریهای فعال نوین تک';
  titleCell.font = { name: 'Vazirmatn', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF172554' } };

  // Row 2: Metadata
  ws.mergeCells('A2:H2');
  const metaRow = ws.getRow(2);
  metaRow.height = 30;
  const metaCell = ws.getCell('A2');
  metaCell.value = `تاریخ خروجی: ${nowJalali()}   |   تعداد پیگیریها: ${activeCount}`;
  metaCell.font = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };

  // Row 3: Blank spacer
  ws.getRow(3).height = 15;

  // Row 4: Headers
  const headerRow = ws.getRow(4);
  headerRow.height = 35;
  const headers = [
    'ردیف', 'نام', 'شماره تماس', 'وضعیت تماس',
    'مشاوره حضوری', 'پیگیری مجدد', 'یادداشتها', 'آخرین ثبت نتیجه'
  ];
  headerRow.values = headers;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  ws.autoFilter = `A4:H${4 + Math.max(1, snapshot.length)}`;

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const time = d.toTimeString().slice(0, 5);
    return `${toJalali(d)} ${time}`;
  };

  snapshot.forEach((c, index) => {
    const rowData = [
      index + 1,
      c.fullName || '',
      c.phone ? String(c.phone) : '',
      c.callStatus || '',
      c.advisory || '',
      c.isFollowUp ? 'بله' : 'خیر',
      c.notes || '',
      formatDateTime(c.latestAttemptAt)
    ];

    const row = ws.addRow(rowData);

    row.eachCell((cell, colNumber) => {
      // 6=courses, 10=nextFollowUp, 11=notes
      const wrapText = [6, 10, 11].includes(colNumber);
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText };
      cell.font = { name: 'Vazirmatn', size: 10, color: { argb: 'FF334155' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const jDate = toJalali(new Date()).replace(/\//g, '-');
  a.download = `novintech-active-followups-${jDate}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
