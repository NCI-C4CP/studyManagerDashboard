import { translateText, translateDate, replaceUnsupportedPDFCharacters,} from "../../src/utils.js";
const { PDFDocument, StandardFonts, rgb } = PDFLib;
import fieldMapping from "../../src/fieldToConceptIdMapping.js";

export const renderPhysicalActivityReportPDF = async (reports, language) => {
    if (!language) {
        language = 'en';
    }

    let currentReport = reports['physActReport'];
    let aerobicImage;
    let aerobicTitle;
    let aerobicBody;
    switch (parseInt(currentReport['d_'+fieldMapping.reports.physicalActivity.aerobicActivity], 10)) {
        case fieldMapping.reports.physicalActivity.aerobicActivityNotMeeting:
            aerobicImage = './reports/physicalActivity/report-dial-low.png';
            aerobicTitle = "physicalActivityNotMeetingTitle";
            aerobicBody = 'physicalActivityNotMeeting';
            break;
        case fieldMapping.reports.physicalActivity.aerobicActivityMeeting:
            aerobicImage = './reports/physicalActivity/report-dial-med.png';
            aerobicTitle = "physicalActivityMeetingTitle";
            aerobicBody = 'physicalActivityMeeting';
            break;
        case fieldMapping.reports.physicalActivity.aerobicActivityExceeding:
            aerobicImage = './reports/physicalActivity/report-dial-high.png';
            aerobicTitle = "physicalActivityExceedingTitle";
            aerobicBody = 'physicalActivityExceeding';
            break;
    }
    let muscleImage;
    let muscleTitle;
    let muscleBody;
    switch (parseInt(currentReport['d_'+fieldMapping.reports.physicalActivity.muscleActivity], 10)) {
        case fieldMapping.yes:
            muscleImage = './reports/physicalActivity/smile.png';
            muscleTitle = "physicalActivityMuscleYesTitle";
            muscleBody = 'physicalActivityMuscleYes';
            break;
        case fieldMapping.no:
            muscleImage = './reports/physicalActivity/flat.png';
            muscleTitle = "physicalActivityMuscleNoTitle";
            muscleBody = 'physicalActivityMuscleNo';
            break;
    }

    const pdfLocation = './reports/physicalActivity/report_'+language+'.pdf';
    const existingPdfBytes = await fetch(pdfLocation).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const editPage = pdfDoc.getPages().at(0);

    let pngAerobicImage;
    let pngMuscleImage;
    if (aerobicImage) {
        const pngAerobicImageBytes = await fetch(aerobicImage).then((res) => res.arrayBuffer());
        pngAerobicImage = await pdfDoc.embedPng(pngAerobicImageBytes);
        editPage.drawImage(pngAerobicImage, {
            x: 50,
            y: 425,
            width: 83,
            height: 43,
        });
    }
    if (muscleImage) {
        const pngMuscleImageBytes = await fetch(muscleImage).then((res) => res.arrayBuffer())
        pngMuscleImage = await pdfDoc.embedPng(pngMuscleImageBytes);
        editPage.drawImage(pngMuscleImage, {
            x: 55,
            y: 185,
            width: 43,
            height: 43,
        });
    }
    const helveticaFontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    if (aerobicTitle) {
        editPage.drawText(replaceUnsupportedPDFCharacters(translateText(['reports', aerobicTitle], language), helveticaFontBold), {
            x: 150,
            y: 435,
            size: 15,
            font: helveticaFontBold,
            color: rgb(1, 1, 1)
        });
    }

    if (aerobicBody) {
        editPage.drawText(replaceUnsupportedPDFCharacters(translateText(['reports', aerobicBody], language), helveticaFont), {
            x: 50,
            y: 400,
            size: 12,
            font: helveticaFont,
            color: rgb(1, 1, 1),
            maxWidth: 320,
            lineHeight: 15
        });
    }
    if (muscleTitle) {
        editPage.drawText(replaceUnsupportedPDFCharacters(translateText(['reports', muscleTitle], language), helveticaFontBold), {
            x: 115,
            y: 195,
            size: 15,
            font: helveticaFontBold,
            color: rgb(1, 1, 1)
        });
    }
    if (muscleBody) {
        editPage.drawText(replaceUnsupportedPDFCharacters(translateText(['reports', muscleBody], language), helveticaFont), {
            x: 50,
            y: 160,
            size: 12,
            font: helveticaFont,
            color: rgb(1, 1, 1),
            maxWidth: 315,
            lineHeight: 15
        });
    }

    let dateX;
    switch (language) {
        case 'en':
            dateX = 102;
            break;
        case 'es':
            dateX = 112;
            break;
    }
    if (currentReport['d_'+fieldMapping.reports.physicalActivity.reportTS]) {
        let reportTime = currentReport['d_'+fieldMapping.reports.physicalActivity.reportTS];
        let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        editPage.drawText(replaceUnsupportedPDFCharacters(translateDate(reportTime, language, dateOptions), helveticaFont), {
            x: dateX,
            y: 727,
            size: 9,
            font: helveticaFont,
            color: rgb(0.18, 0.18, 0.18),
            maxWidth: 315,
            lineHeight: 15
        });
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    download(pdfBytes, 'Physical_Activity_Report.pdf', "application/pdf");
}