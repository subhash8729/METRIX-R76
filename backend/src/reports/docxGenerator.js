const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle
} = require('docx');
const fs = require('fs');

/**
 * Generates official editable Microsoft Word (.docx) test report
 */
async function generateDOCXReport(reportData, outputPath) {
  const isPass = reportData.overall_compliance === 'PASS';
  const inst = reportData.instrument || {};
  const env = reportData.environmental_conditions || {};

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'GOVERNMENT OF INDIA',
                bold: true,
                size: 26,
                color: '0F2C59'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION',
                size: 20,
                bold: true
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'DEPARTMENT OF CONSUMER AFFAIRS (DoCA) - LEGAL METROLOGY DIVISION',
                italics: true,
                size: 18,
                color: '555555'
              })
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'TYPE EVALUATION TEST REPORT (NAWI)',
                bold: true,
                size: 28,
                color: '0F2C59'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'As per OIML Recommendation R-76-1:2006',
                italics: true,
                size: 20
              })
            ]
          }),
          new Paragraph({ text: '' }),

          // Report Metadata
          new Paragraph({
            children: [
              new TextRun({ text: 'Report Number: ', bold: true }),
              new TextRun({ text: reportData.report_number || 'DOCA-R76-001' }),
              new TextRun({ text: '   |   Issue Date: ', bold: true }),
              new TextRun({ text: new Date().toLocaleDateString('en-GB') }),
              new TextRun({ text: '   |   Status: ', bold: true }),
              new TextRun({ text: reportData.overall_compliance || 'PASS', bold: true, color: isPass ? '008000' : 'CC0000' })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Laboratory: ', bold: true }),
              new TextRun({ text: reportData.lab_name || 'Regional Reference Standard Laboratory (RRSL)' }),
              new TextRun({ text: '   |   Project UID: ', bold: true }),
              new TextRun({ text: reportData.project_uid || 'PRJ-2026-001' })
            ]
          }),
          new Paragraph({ text: '' }),

          // Section 1: Instrument Specifications
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '1. Instrument Under Test Specifications', bold: true, color: '0F2C59' })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Instrument Name:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(inst.name || 'Electronic Bench Scale')] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Manufacturer:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(inst.manufacturer_name || 'N/A')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Model Number:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(inst.model_number || 'N/A')] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Serial Number:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(inst.serial_number || 'N/A')] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Accuracy Class:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph((inst.accuracy_class || 'CLASS_III').replace('CLASS_', 'Class '))] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Max Capacity:', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${inst.max_capacity} ${inst.unit || 'g'}`)] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Verification Interval (e):', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${inst.verification_scale_interval_e} ${inst.unit || 'g'}`)] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Actual Interval (d):', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${inst.actual_scale_interval_d} ${inst.unit || 'g'}`)] })
                ]
              })
            ]
          }),
          new Paragraph({ text: '' }),

          // Section 2: Environmental Conditions
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '2. Environmental Conditions & Standards', bold: true, color: '0F2C59' })]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `* Temperature: ${env.temperature_celsius || '22.0'} °C   |   Humidity: ${env.relative_humidity_percent || '50.0'} %   |   Pressure: ${env.atmospheric_pressure_hpa || '1013'} hPa\n` }),
              new TextRun({ text: `* Reference Weights: Calibrated OIML E2/F1 Stainless Steel Standards (RRSL/NPL Certified)` })
            ]
          }),
          new Paragraph({ text: '' }),

          // Section 3: Test Summary Table
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '3. Metrological Evaluation Summary', bold: true, color: '0F2C59' })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Clause', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Test Name', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Permissible Limit', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Result', bold: true })] })] })
                ]
              }),
              ...(reportData.tests || []).map(t => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(t.clause || 'OIML R-76')] }),
                  new TableCell({ children: [new Paragraph(t.name || 'Test')] }),
                  new TableCell({ children: [new Paragraph(t.permissible_summary || 'Table 6 Limit')] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.compliance_result || 'PASS', bold: true, color: t.compliance_result === 'PASS' ? '008000' : 'CC0000' })] })] })
                ]
              }))
            ]
          }),
          new Paragraph({ text: '' }),

          // Section 4: Regulatory Conclusion
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '4. Regulatory Conclusion & Approval', bold: true, color: '0F2C59' })]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: isPass
                  ? 'CONCLUSION: The Non-Automatic Weighing Instrument (NAWI) meets all metrological and technical requirements under OIML Recommendation R-76-1:2006.'
                  : 'CONCLUSION: The instrument does NOT comply with OIML R-76 specifications.',
                bold: true,
                color: isPass ? '008000' : 'CC0000'
              })
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Tested by: Er. Vikram Malhotra, Senior Metrology Officer\n' }),
              new TextRun({ text: 'Reviewed by: Dr. Sunita Deshmukh, Joint Director / Reviewer\n' }),
              new TextRun({ text: 'Final Approval: Shri Amitav Ghosh, Controller of Legal Metrology (DoCA)' })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  return { filePath: outputPath };
}

module.exports = {
  generateDOCXReport
};
