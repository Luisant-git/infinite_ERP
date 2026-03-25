import { BadRequestException } from '@nestjs/common';

export function getFinancialYearDates(
  fy: string, 
  startMonth: any = 4, 
  startDay: any = 1,
  endMonth: any = 3,
  endDay: any = 31
) {
  if (!fy) {
    return { startDate: null, endDate: null };
  }

  // Use regex to extract all numbers from the string (e.g., "FY 25-26" -> ["25", "26"])
  const years = fy.match(/\d+/g);
  if (!years || years.length < 2) {
    return { startDate: null, endDate: null };
  }

  let startYear = parseInt(years[0]);
  let endYearPart = parseInt(years[1]);

  if (startYear < 100) startYear += 2000;
  
  let endYear = endYearPart;
  if (endYear < 100) {
     const startCentury = Math.floor(startYear / 100) * 100;
     endYear += startCentury;
  }

  // Handle case where years are the same (e.g., calendar year FY 2025-2025)
  // or if they provide something like "2025-26" and startMonth is 1.
  
  const sMonth = (Number(startMonth || 4)) - 1;
  const sDay = Number(startDay || 1);
  const eMonth = (Number(endMonth || 3)) - 1;
  const eDay = Number(endDay || 31);

  const startDate = new Date(startYear, sMonth, sDay, 0, 0, 0, 0);
  const endDate = new Date(endYear, eMonth, eDay, 23, 59, 59, 999);

  return { startDate, endDate };
}

export function validateTransactionDate(
  transactionDate: any, 
  financialYear: string, 
  startMonth: any = 4, 
  startDay: any = 1,
  endMonth: any = 3,
  endDay: any = 31
) {
  if (!transactionDate) return true;

  const { startDate, endDate } = getFinancialYearDates(financialYear, startMonth, startDay, endMonth, endDay);
  if (!startDate || !endDate) return true;

  const entryDate = new Date(transactionDate);
  
  if (entryDate < startDate || entryDate > endDate) {
    // Manually format date to DD/MM/YYYY for consistent display
    const formatDate = (date: Date) => {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };

    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);
    const formattedEntry = formatDate(entryDate);

    throw new BadRequestException(
       `Entry date (${formattedEntry}) must be within the selected Financial Year (${formattedStart} to ${formattedEnd}).`
    );
  }

  return true;
}

