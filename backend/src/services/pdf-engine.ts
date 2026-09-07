import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import os from 'os';
import prisma from './db';

export class PdfEngine {
  private static registeredHelpers = false;

  private static ensureHelpers() {
    if (this.registeredHelpers) return;
    handlebars.registerHelper('isPaid', function(this: any, hasPaidFees: boolean, options: any) {
      if (hasPaidFees) return options.fn(this);
      return options.inverse(this);
    });
    
    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });
    this.registeredHelpers = true;
  }

  private static loadTemplateAndStyles() {
    let templatePath = path.join(__dirname, '../templates/report-card.hbs');
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(__dirname, '../../src/templates/report-card.hbs');
    }
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    let tailwindPath = path.join(__dirname, '../templates/tailwind.css');
    if (!fs.existsSync(tailwindPath)) {
      tailwindPath = path.join(__dirname, '../../src/templates/tailwind.css');
    }
    let tailwindCss = '';
    if (fs.existsSync(tailwindPath)) {
      tailwindCss = fs.readFileSync(tailwindPath, 'utf8');
    }

    return { templateHtml, tailwindCss };
  }

  /**
   * Compiles the exact report card HTML for a single enrollment.
   * Can be served directly in browser (view/print) or converted to PDF.
   */
  static async compileReportHtml(enrollment: any, totalInClass: number = 1, classAverage: number = 0): Promise<string> {
    this.ensureHelpers();
    const { templateHtml, tailwindCss } = this.loadTemplateAndStyles();

    let primaryColor = '#e11d48';
    let logoUrl = '';
    let schoolName = 'School Enterprise Pilot School';

    const schoolId = enrollment.student?.schoolId;
    if (schoolId) {
      const school: any = await prisma.school.findUnique({ where: { id: schoolId } });
      if (school) {
        primaryColor = school.primaryColor || primaryColor;
        logoUrl = school.logoUrl || '';
        schoolName = school.name || schoolName;
      }
    }

    const studentData = {
      tailwindCss,
      primaryColor,
      logoUrl,
      hasPaidFees: enrollment.termRecord?.hasPaidFees ?? false,
      schoolName,
      academicTerm: `${enrollment.academicTerm?.termName || ''} ${enrollment.academicTerm?.year || ''}`.trim(),
      studentName: `${enrollment.student?.lastName || ''}, ${enrollment.student?.firstName || ''}`,
      admissionNumber: enrollment.student?.admissionNumber || '',
      className: `${enrollment.class?.name || ''} ${enrollment.class?.arm || ''}`.trim(),
      positionOrdinal: enrollment.positionOrdinal || '1st',
      totalInClass: totalInClass || 1,
      totalMarks: enrollment.totalMarks ?? 0,
      averageScore: enrollment.averageScore ?? 0,
      classAverage,
      daysPresent: enrollment.termRecord?.attendanceTracker ? 
        Object.values(enrollment.termRecord.attendanceTracker).flatMap((week: any) => Object.values(week)).filter(v => v === 'P').length : (enrollment.termRecord?.daysPresent || 0),
      daysOpened: enrollment.termRecord?.daysOpened || 0,
      scores: (enrollment.scores || []).map((s: any) => ({
        subject: s.subject?.name || 'Subject',
        ca1: s.ca1 !== null && s.ca1 !== undefined ? s.ca1 : '-',
        ca2: s.ca2 !== null && s.ca2 !== undefined ? s.ca2 : '-',
        ca3: s.ca3 !== null && s.ca3 !== undefined ? s.ca3 : '-',
        exam: s.exam !== null && s.exam !== undefined ? s.exam : '-',
        totalScore: s.totalScore !== null && s.totalScore !== undefined ? s.totalScore : '-',
        gradingLetter: s.gradingLetter || 'F'
      })),
      punctuality: enrollment.termRecord?.punctuality || 5,
      neatness: enrollment.termRecord?.neatness || 5,
      teamwork: enrollment.termRecord?.teamwork || 5,
      remark: enrollment.termRecord?.formMasterRemark || 'Consistent effort demonstrated. Keep pushing for higher academic heights.',
      principalRemark: enrollment.termRecord?.principalRemark || 'A commendable term result. Approved for promotion/advancement.',
      principalSignatureName: 'Dr. A. B. Principal',
      currentDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const template = handlebars.compile(templateHtml);
    return template(studentData);
  }

  static async generateReportsBatch(enrollments: any[], templateConfig: any) {
    this.ensureHelpers();
    const reportsDir = path.join(os.tmpdir(), 'school-reports');
    if (!fs.existsSync(reportsDir)) {
      try {
        fs.mkdirSync(reportsDir, { recursive: true });
      } catch (err) {
        console.warn('Could not create reports directory:', err);
      }
    }

    const classAverage = enrollments.length > 0 ? 
      Number((enrollments.reduce((acc, e) => acc + (e.averageScore || 0), 0) / enrollments.length).toFixed(1)) : 0;

    // Check if puppeteer is available in this environment
    let puppeteerModule: any = null;
    try {
      puppeteerModule = await import('puppeteer');
    } catch {
      console.warn('[PdfEngine] Puppeteer module unavailable in current environment.');
    }

    if (!puppeteerModule || process.env.VERCEL) {
      console.log('[PdfEngine] Serverless environment detected; skipping headless Chromium PDF bake to prevent cold-start crash.');
      return;
    }

    try {
      const browser = await puppeteerModule.default.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      try {
        for (const enrollment of enrollments) {
          const htmlContent = await this.compileReportHtml(enrollment, enrollments.length, classAverage);
          const page = await browser.newPage();
          await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
          
          const fileName = `report-${enrollment.student.admissionNumber.replace(/[^a-zA-Z0-9]/g, '')}-${enrollment.academicTerm?.id || 'term'}.pdf`;
          const filePath = path.join(reportsDir, fileName);
          
          await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
          });
          console.log(`[PdfEngine] Saved PDF to ${filePath}`);
          await page.close();
        }
      } finally {
        await browser.close();
      }
    } catch (err: any) {
      console.warn(`[PdfEngine] Chromium PDF generation skipped or failed (${err.message}). Reports will be served via direct HTML printable stream.`);
    }
  }
}
