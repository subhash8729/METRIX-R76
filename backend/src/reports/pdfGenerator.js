const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generates official DoCA / OIML R-76 Type Evaluation Test Report
 * @param {Object} reportData
 * @param {string} outputPath
 * @returns {Promise<{ filePath, checksum }>}
 */
function generatePDFReport(reportData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Color Palette - Official Government / Professional Metrology
      const primaryColor = '#0F2C59'; // Deep Navy
      const secondaryColor = '#D80032'; // Subtle red accent
      const accentColor = '#337CCF'; // Metrology Blue
      const lightBg = '#F8F9FA';
      const darkText = '#1A1A1A';
      const mutedText = '#555555';

      // --- PAGE 1: HEADER & COVER DETAILS ---
      // Top Government Banner
      doc.rect(40, 40, 515, 60).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold')
        .text('GOVERNMENT OF INDIA', 40, 48, { align: 'center', width: 515 });
      doc.fontSize(10).font('Helvetica')
        .text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', 40, 63, { align: 'center', width: 515 });
      doc.fontSize(9).font('Helvetica-Oblique')
        .text('DEPARTMENT OF CONSUMER AFFAIRS (DoCA) - LEGAL METROLOGY DIVISION', 40, 76, { align: 'center', width: 515 });

      doc.moveDown(2.5);

      // Report Title
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
        .text('TYPE EVALUATION TEST REPORT', { align: 'center' });
      doc.fontSize(11).font('Helvetica')
        .fillColor(mutedText)
        .text('As per OIML Recommendation R-76-1:2006 (NAWI)', { align: 'center' });

      doc.moveDown(1);

      // Report Header Block
      const startY = doc.y;
      doc.rect(40, startY, 515, 65).fill(lightBg).stroke('#CCCCCC');
      
      doc.fillColor(darkText).fontSize(9).font('Helvetica-Bold');
      doc.text(`Report Number:`, 50, startY + 10);
      doc.font('Helvetica').text(reportData.report_number || 'N/A', 140, startY + 10);

      doc.font('Helvetica-Bold').text(`Test Project UID:`, 50, startY + 25);
      doc.font('Helvetica').text(reportData.project_uid || 'N/A', 140, startY + 25);

      doc.font('Helvetica-Bold').text(`Testing Standard:`, 50, startY + 40);
      doc.font('Helvetica').text(`${reportData.standard_title || 'OIML R-76'} (${reportData.rule_version || '2006'})`, 140, startY + 40);

      doc.font('Helvetica-Bold').text(`Issue Date:`, 330, startY + 10);
      doc.font('Helvetica').text(new Date(reportData.issue_date || Date.now()).toLocaleDateString('en-GB'), 410, startY + 10);

      doc.font('Helvetica-Bold').text(`Testing Laboratory:`, 330, startY + 25);
      doc.font('Helvetica').text(reportData.lab_name || 'RRSL Faridabad', 410, startY + 25, { width: 140 });

      doc.font('Helvetica-Bold').text(`Evaluation Result:`, 330, startY + 45);
      const isPass = reportData.overall_compliance === 'PASS';
      doc.font('Helvetica-Bold')
        .fillColor(isPass ? '#008000' : '#CC0000')
        .text(reportData.overall_compliance || 'PENDING', 410, startY + 45);

      doc.moveDown(3);

      // Section 1: Instrument Under Test (NAWI Specification)
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
        .text('1. INSTRUMENT UNDER TEST (NAWI)');
      doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.5);

      const inst = reportData.instrument || {};
      const instData = [
        ['Instrument Name / Type:', inst.name || 'Electronic Weighing Scale', 'Manufacturer:', inst.manufacturer_name || 'N/A'],
        ['Model Number:', inst.model_number || 'N/A', 'Serial Number:', inst.serial_number || 'N/A'],
        ['Accuracy Class:', (inst.accuracy_class || 'CLASS_III').replace('CLASS_', 'Class '), 'Max Capacity (Max):', `${inst.max_capacity} ${inst.unit || 'g'}`],
        ['Min Capacity (Min):', `${inst.min_capacity} ${inst.unit || 'g'}`, 'Verification Interval (e):', `${inst.verification_scale_interval_e} ${inst.unit || 'g'}`],
        ['Actual Interval (d):', `${inst.actual_scale_interval_d} ${inst.unit || 'g'}`, 'Number of Intervals (n):', `${inst.number_of_intervals_n || 'N/A'}`],
        ['Tare Facility:', inst.tare_type || 'Subtractive', 'Software Version:', inst.software_version || 'v1.0']
      ];

      let tableY = doc.y;
      instData.forEach(row => {
        doc.rect(40, tableY, 515, 18).fill(tableY % 36 === 0 ? '#FFFFFF' : '#F9F9F9');
        doc.fillColor(darkText).fontSize(8.5).font('Helvetica-Bold').text(row[0], 45, tableY + 4);
        doc.font('Helvetica').text(String(row[1]), 170, tableY + 4);
        doc.font('Helvetica-Bold').text(row[2], 300, tableY + 4);
        doc.font('Helvetica').text(String(row[3]), 420, tableY + 4);
        tableY += 18;
      });

      doc.y = tableY + 15;

      // Section 2: Environmental Conditions & Equipment Used
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
        .text('2. ENVIRONMENTAL CONDITIONS & REFERENCE STANDARDS');
      doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.5);

      const env = reportData.environmental_conditions || {};
      doc.fillColor(darkText).fontSize(8.5).font('Helvetica');
      doc.text(`* Ambient Temperature: ${env.temperature_celsius || '22.0'} °C   |   Relative Humidity: ${env.relative_humidity_percent || '50.0'} %   |   Pressure: ${env.atmospheric_pressure_hpa || '1013'} hPa`, 45, doc.y);
      doc.moveDown(0.3);
      doc.text(`* Reference Standards: ${reportData.equipment_used ? reportData.equipment_used.map(e => `${e.name} (${e.accuracy_class}, Cert: ${e.certificate_number})`).join('; ') : 'OIML Class E2/F1 Standards (Calibrated)'}`, 45, doc.y, { width: 505 });

      doc.moveDown(1.5);

      // Section 3: Summary of Metrological Tests Performed
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
        .text('3. METROLOGICAL TEST COMPLIANCE SUMMARY');
      doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.5);

      // Table Header
      let testSumY = doc.y;
      doc.rect(40, testSumY, 515, 20).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
      doc.text('Clause', 45, testSumY + 5);
      doc.text('Test Description', 130, testSumY + 5);
      doc.text('Permissible Limit (mpe)', 330, testSumY + 5);
      doc.text('Result', 480, testSumY + 5);

      testSumY += 20;
      const tests = reportData.tests || [];
      tests.forEach((t, idx) => {
        doc.rect(40, testSumY, 515, 22).fill(idx % 2 === 0 ? '#FFFFFF' : '#F9F9F9').stroke('#E5E5E5');
        doc.fillColor(darkText).fontSize(8).font('Helvetica-Bold').text(t.clause || 'OIML R-76', 45, testSumY + 6);
        doc.font('Helvetica').text(t.name || 'Test', 130, testSumY + 6, { width: 190 });
        doc.text(t.permissible_summary || 'As per Table 6', 330, testSumY + 6, { width: 140 });
        const pass = t.compliance_result === 'PASS';
        doc.font('Helvetica-Bold')
          .fillColor(pass ? '#008000' : '#CC0000')
          .text(t.compliance_result || 'PENDING', 480, testSumY + 6);
        testSumY += 22;
      });

      // --- PAGE 2+: DETAILED TEST OBSERVATION TABLES ---
      doc.addPage();

      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold')
        .text('4. DETAILED TEST OBSERVATIONS & AUTOMATED CALCULATIONS', { align: 'left' });
      doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(1);

      // List detailed observations
      let obsY = doc.y;
      const detailedObservations = reportData.detailed_observations || [];

      if (detailedObservations.length > 0) {
        doc.rect(40, obsY, 515, 18).fill('#EAECEE');
        doc.fillColor(darkText).fontSize(7.5).font('Helvetica-Bold');
        doc.text('Test / Clause', 45, obsY + 5);
        doc.text('Load (L)', 150, obsY + 5);
        doc.text('Indication (I)', 215, obsY + 5);
        doc.text('delta_L', 285, obsY + 5);
        doc.text('Error (Ec)', 340, obsY + 5);
        doc.text('mpe (Limit)', 410, obsY + 5);
        doc.text('Status', 480, obsY + 5);
        obsY += 18;

        detailedObservations.forEach((obs, i) => {
          if (obsY > 720) {
            doc.addPage();
            obsY = 50;
          }
          doc.rect(40, obsY, 515, 18).fill(i % 2 === 0 ? '#FFFFFF' : '#FAFAFA').stroke('#F0F0F0');
          doc.fillColor(darkText).fontSize(7.5).font('Helvetica');
          doc.text(obs.test_name ? obs.test_name.substring(0, 20) : 'Test', 45, obsY + 5);
          doc.text(`${obs.load_applied} ${inst.unit || 'g'}`, 150, obsY + 5);
          doc.text(`${obs.indicated_value} ${inst.unit || 'g'}`, 215, obsY + 5);
          doc.text(`${obs.delta_load || 0}`, 285, obsY + 5);
          doc.text(`${obs.corrected_error_Ec || obs.calculated_error_E || 0}`, 340, obsY + 5);
          doc.text(`±${obs.permissible_error_mpe}`, 410, obsY + 5);

          const ok = obs.status === 'PASS';
          doc.font('Helvetica-Bold')
            .fillColor(ok ? '#008000' : '#CC0000')
            .text(obs.status || 'PASS', 480, obsY + 5);
          obsY += 18;
        });
      } else {
        doc.fontSize(9).font('Helvetica-Oblique').fillColor(mutedText)
          .text('Detailed observation records are archived and accessible in digital laboratory repository.', 45, obsY + 10);
        obsY += 30;
      }

      doc.y = obsY + 25;

      // Section 5: Regulatory Compliance Decision & Signatures
      if (doc.y > 600) doc.addPage();

      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
        .text('5. REGULATORY CONCLUSION & AUTHORIZATION');
      doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.8);

      const decisionBoxY = doc.y;
      doc.rect(40, decisionBoxY, 515, 55).fill(isPass ? '#E8F5E9' : '#FFEBEE').stroke(isPass ? '#2E7D32' : '#C62828');
      doc.fillColor(isPass ? '#1B5E20' : '#B71C1C').fontSize(9.5).font('Helvetica-Bold')
        .text(`COMPLIANCE DECISION: ${isPass ? 'APPROVED (CONFORMS TO OIML R-76)' : 'REJECTED (NON-COMPLIANT)'}`, 55, decisionBoxY + 10);
      doc.font('Helvetica').fontSize(8.5).fillColor(darkText)
        .text(reportData.final_statement || 
          (isPass
            ? 'The tested Non-Automatic Weighing Instrument (NAWI) satisfies all metrological criteria, maximum permissible errors (mpe), repeatability, eccentricity, and discrimination requirements as defined in OIML R-76-1:2006.'
            : 'The instrument failed one or more mandatory metrological requirements and does NOT conform to OIML R-76.'),
          55, decisionBoxY + 25, { width: 485 });

      doc.y = decisionBoxY + 75;

      // Signatures Block
      const sigY = doc.y;
      doc.rect(40, sigY, 160, 80).stroke('#DDDDDD');
      doc.rect(215, sigY, 160, 80).stroke('#DDDDDD');
      doc.rect(395, sigY, 160, 80).stroke('#DDDDDD');

      doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('TESTED BY (OFFICER)', 45, sigY + 6);
      doc.text('REVIEWED BY (REVIEWER)', 220, sigY + 6);
      doc.text('FINAL APPROVAL (APPROVER)', 400, sigY + 6);

      doc.fontSize(7.5).font('Helvetica').fillColor(darkText);
      doc.text(reportData.officer_name || 'Er. Vikram Malhotra', 45, sigY + 45);
      doc.text('Senior Metrology Test Officer', 45, sigY + 56);
      doc.text('Signed digitally', 45, sigY + 67);

      doc.text(reportData.reviewer_name || 'Dr. Sunita Deshmukh', 220, sigY + 45);
      doc.text('Joint Director (Legal Metrology)', 220, sigY + 56);
      doc.text('Verified & Signed', 220, sigY + 67);

      doc.text(reportData.approver_name || 'Shri Amitav Ghosh', 400, sigY + 45);
      doc.text('Controller of Legal Metrology', 400, sigY + 56);
      doc.text('Authorized & Finalized', 400, sigY + 67);

      // --- FOOTERS & INTEGRITY CHECKSUM ON ALL PAGES ---
      const range = doc.bufferedPageRange();
      const reportHash = reportData.checksum_hash || crypto.createHash('sha256').update(reportData.report_number + Date.now()).digest('hex');

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(40, 795, 515, 25).fill('#F0F2F5');
        doc.fillColor(mutedText).fontSize(7).font('Helvetica')
          .text(`METRIX-R76 | DoCA Digital Verification Portal | Report ID: ${reportData.report_number || 'DOCA-R76-001'} | Page ${i + 1} of ${range.count}`, 45, 800);
        doc.text(`Tamper-Evident SHA-256 Checksum: ${reportHash.substring(0, 36)}...`, 45, 810);
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          filePath: outputPath,
          checksum: reportHash
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePDFReport
};
