import { dashboardNavBarLinks, removeActiveClass } from './navigationBar.js';
import { renderParticipantHeader } from './participantHeader.js';
import fieldMapping from './fieldToConceptIdMapping.js';
import { userProfile, verificationStatus, baselineBOHSurvey, baselineMRESurvey,baselineSASSurvey, 
    baselineLAWSurvey, baselineSSN, baselineCOVIDSurvey, baselineBloodSample, baselineUrineSample, baselineBiospecSurvey, baselineMenstrualSurvey,
    baselineMouthwashSample, baselineMouthwashR1Sample, baselineMouthwashR2Sample, baselineBloodUrineSurvey, baselineMouthwashSurvey, baselinePromisSurvey, baselineEMR, baselinePayment, 
    baselineExperienceSurvey, cancerScreeningHistorySurvey, dhqSurvey, baselinePhysActReport, dhq3Report} from './participantSummaryRow.js';
import { baseAPI, formatUTCDate, getIdToken, hideAnimation, conceptToSiteMapping, pdfCoordinatesMap, showAnimation, translateDate } from './utils.js';
import { renderPhysicalActivityReportPDF } from '../reports/physicalActivity/physicalActivity.js';

const { PDFDocument, StandardFonts, rgb } = PDFLib;

document.body.scrollTop = document.documentElement.scrollTop = 0;

export const renderParticipantSummary = (participant, reports) => {
    document.getElementById('navBarLinks').innerHTML = dashboardNavBarLinks();
    removeActiveClass('nav-link', 'active');
    document.getElementById('participantSummaryBtn').classList.add('active');
    if (participant !== null) {
        document.querySelector("#mainContent").innerHTML = render(participant, reports);
        downloadCopyHandler(participant);
        downloadReportHandler(participant, reports);
    }
};

export const render = (participant, reports) => {
    if (!participant) {
        return `
            <div class="container-fluid">
                <div id="root">
                    Please select a participant first!
                </div>
            </div>`;
    }

    return `
        <div class="container-fluid">
            <div id="root root-margin">
                ${renderParticipantHeader(participant)}
                <div class="table-responsive">
                    <span> <h4 style="text-align: center;">Participant Summary </h4> </span>
                    <div class="sticky-header">
                        <table class="table table-striped">
                            <thead class="thead-dark sticky-row"> 
                                <tr>
                                    <th class="sticky-row" scope="col">Icon</th>
                                    <th class="sticky-row" scope="col">Timeline</th>
                                    <th class="sticky-row" scope="col">Category</th>
                                    <th class="sticky-row" scope="col">Item</th>
                                    <th class="sticky-row" scope="col">Status</th>
                                    <th class="sticky-row" scope="col">Date</th>
                                    <th class="sticky-row" scope="col">Setting</th>
                                    <th class="sticky-row" scope="col">Refused</th>
                                    <th class="sticky-row" scope="col">Extra</th>
                                </tr>
                            </thead>   
                            <tbody>
                                <tr class="row-color-enrollment-dark">
                                    ${consentHandler(participant)}
                                </tr>
                                <tr class="row-color-enrollment-light">
                                    ${hippaHandler(participant)}
                                </tr>
                                <tr class="row-color-enrollment-dark">
                                    ${userProfile(participant)}
                                </tr>
                                <tr class="row-color-enrollment-light">
                                    ${verificationStatus(participant)}
                                </tr>
                                <tr class="row-color-survey-dark">
                                    ${baselineBOHSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-light">
                                    ${baselineMRESurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-dark">
                                    ${baselineSASSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-light">
                                    ${baselineLAWSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-dark">
                                    ${baselineSSN(participant)}
                                </tr>
                                <tr class="row-color-survey-light">
                                    ${baselineCOVIDSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-dark">
                                    ${baselineBiospecSurvey(participant)}
                                </tr>
                                <tr class="row-color-enrollment-light"> 
                                    ${baselineMenstrualSurvey(participant)} 
                                </tr>                   
                                <tr class="row-color-survey-dark">
                                    ${baselineBloodUrineSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-light">
                                    ${baselineMouthwashSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-dark">
                                    ${baselinePromisSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-light">
                                    ${baselineExperienceSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-dark">
                                    ${dhqSurvey(participant)}
                                </tr>
                                <tr class="row-color-survey-light">
                                    ${cancerScreeningHistorySurvey(participant)}
                                </tr>
                                <tr class="row-color-sample-dark">
                                    ${baselineBloodSample(participant)}
                                </tr>                           
                                <tr class="row-color-sample-light">
                                    ${baselineUrineSample(participant)}
                                </tr>
                                <tr class="row-color-sample-dark">
                                    ${baselineMouthwashSample(participant)}
                                </tr>
                                <tr class="row-color-sample-light">
                                    ${baselineMouthwashR1Sample(participant)}
                                </tr>
                                <tr class="row-color-sample-dark">
                                    ${baselineMouthwashR2Sample(participant)}
                                </tr>
                                <tr class="row-color-payment">
                                    ${baselinePayment(participant)}
                                </tr>
                                <tr class="row-color-emr-light">
                                    ${baselineEMR(participant)}
                                </tr>
                                <tr class="row-color-roi-dark">
                                    ${baselinePhysActReport(participant, reports)}
                                </tr>
                                <tr class="row-color-roi-light">
                                    ${dhq3Report(participant, reports)}
                                </tr>
                                ${participant[fieldMapping.revokeHIPAA] === fieldMapping.yes ? 
                                    (`<tr class="row-color-enrollment-dark"> ${hipaaRevocation(participant)} </tr>`) : (``)}
                                ${participant[fieldMapping.destroyData] === fieldMapping.yes ? 
                                    (`<tr class="row-color-enrollment-dark"> ${dataDestroy(participant)} </tr>`): (``)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`;
};

const downloadCopyHandler = (participant) => {
    const a = document.getElementById('downloadCopy');
    const defaultVersion = 'V0.02';
    const defaultLang = 'Eng';
    if (a) {
        const versionArray = participant[fieldMapping.consentVersion].split('_');
        const version = versionArray[2];
        const lang = versionArray[3];
        a.addEventListener('click',  () => { 
            try {
                renderDownload(participant, formatUTCDate(participant[fieldMapping.consentDate]), `./forms/Consent/${conceptToSiteMapping[participant[fieldMapping.healthcareProvider]]}_consent_${(version || defaultVersion)}${(lang ? '_'+lang : '')}.pdf`, 
                    getHealthcareProviderCoordinates(conceptToSiteMapping[participant[fieldMapping.healthcareProvider]], 'consent', version || defaultVersion, lang || defaultLang));
            } catch (error) {
                console.error(error);
                alert('An error has occured generating the pdf please contact support')
            }
        })
    }
    const b = document.getElementById('downloadCopyHIPAA');
    if (b) {
        const versionArray = participant[fieldMapping.hipaaVersion].split('_');
        const version = versionArray[2];
        const lang = versionArray[3];
        b.addEventListener('click',  () => {  
            try {
                renderDownload(participant, formatUTCDate(participant[fieldMapping.hippaDate]), `./forms/HIPAA/${conceptToSiteMapping[participant[fieldMapping.healthcareProvider]]}_HIPAA_${(version || defaultVersion)}${(lang ? '_'+lang : '')}.pdf`, 
                    getHealthcareProviderCoordinates(conceptToSiteMapping[participant[fieldMapping.healthcareProvider]], 'hipaa', version || defaultVersion, lang || defaultLang));
             } catch (error) {
                console.error(error);
                alert('An error has occured generating the pdf please contact support')
            }
        })
    }
    const c = document.getElementById('downloadCopyHipaaRevoc');
    if (c) {
        const versionArray = participant[fieldMapping.versionHIPAARevoc].split('_');
        const version = versionArray[2] || 'V1.0';
        const lang = versionArray[3];
        c.addEventListener('click',  () => {  
            renderDownload(participant, formatUTCDate(participant[fieldMapping.dateHIPAARevoc]), `./forms/HIPAA Revocation/HIPAA_Revocation_${version}${(lang ? '_'+lang : '')}.pdf`, getRevocationCoordinates('HIPAA',version,lang || 'Eng'), 'hipaarevoc');
        })
    }
    const d = document.getElementById('downloadCopyDataDestroy');
    if (d) {
        const versionArray = participant[fieldMapping.versionDataDestroy].split('_');
        const version = versionArray[2] || 'V1.0';
        const lang = versionArray[3];
        d.addEventListener('click',  () => {  
            renderDownload(participant, formatUTCDate(participant[fieldMapping.dateDataDestroy]), `./forms/Data Destruction/Data_Destruction_${version}${(lang ? '_'+lang : '')}.pdf`, getRevocationCoordinates('Data',version,lang || 'Eng'), 'datadestruction');
        })
    }
 
}

const downloadReportHandler = (participant, reports) => {
    
    let lang;
    switch (participant[fieldMapping.preferredLanguage]) {
        case fieldMapping.language.en:
            lang = 'en';
            break;
        case fieldMapping.language.es:
            lang = 'es';
            break;
        default:
            lang = 'en';
            break;
    }
    const a = document.getElementById('downloadPhysActReport');
    if (a) {
        a.addEventListener('click',  () => { 
            try {
                renderPhysicalActivityReportPDF(reports, lang);
            } catch (error) {
                console.error(error);
                alert('An error has occured generating the pdf please contact support')
            }
        })
    }

    const dhqHEIReportDownloadLink = document.getElementById('downloadDHQHEIReport');
    if (dhqHEIReportDownloadLink) {
        dhqHEIReportDownloadLink.addEventListener('click', async () => {
            try {
                showAnimation();
                const uid = participant.state.uid;
                const dhqSurveyStatus = participant[fieldMapping.dhqSurveyStatus];
                const studyID = participant[fieldMapping.dhqStudyID];
                const respondentUsername = participant[fieldMapping.dhqUsername];
                const reportDate = participant[fieldMapping.dhqSurveyCompletedDate];
                const reportData = await retrieveDHQHEIReport(dhqSurveyStatus, studyID, respondentUsername);

                if (!reportData) {
                    alert('No DHQ HEI Report data found for this participant.');
                    console.error('No DHQ HEI Report data found for this participant.');
                }

                const blob = await generateDHQHEIPDF(lang, reportDate, reportData);
                if (!blob) {
                    alert('Failed to generate PDF blob.');
                    console.error('Failed to generate PDF blob.');
                    return;
                }

                handleDHQHEIPDFDownload(blob, reportDate, participant['Connect_ID']);

            } catch (error) {
                console.error(error);
                alert('An error has occured generating the pdf. Please contact support');

            } finally {
                hideAnimation();
            }
        });
    }
}

export const retrieveDHQHEIReport = async (dhqSurveyStatus, studyID, respondentUsername) => {
    
    if (dhqSurveyStatus !== fieldMapping.submitted || !studyID || !respondentUsername) {
        console.error('DHQ3 Retrieval criteria not met:', dhqSurveyStatus, studyID, respondentUsername);
        return null;
    }

    try {
        const idToken = await getIdToken();
        const response = await fetch(`${baseAPI}/dashboard?api=retrieveDHQHEIReport`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + idToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ studyID, respondentUsername })
        });

        if (!response.ok) {
            const error = (response.status + ": " + (await response.json()).message);
            throw new Error(error);
        }

        const reportData = await response.json();
        if (reportData.code === 200) {
            return reportData.data || null;
        }

        throw new Error('Failed to retrieve DHQ HEI Report data. Response code: ' + reportData.code);

    } catch (error) {
        console.error('Error in retrieveDHQHEIReport:', error);
        throw error;
    }
}

const generateDHQHEIPDF = async (lang, dhqCompletedDate, reportData) => {
    const binaryString = atob(reportData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const pdfDoc = await PDFDocument.load(bytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const dateOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    const reportGeneratedDate = new Date(dhqCompletedDate);
    const dateString = translateDate(reportGeneratedDate, lang, dateOptions);
    const fontSize = 16;

    const textWidth = helveticaFont.widthOfTextAtSize(dateString, fontSize);
    const x = (width - textWidth) / 2;  // Horizontally center the text
    const y = height - 245;             // Under the 'Healthy Eating Index' title

    firstPage.drawText(dateString, {
        x: x,
        y: y,
        font: helveticaFont,
        size: fontSize,
    });

    const pdfBytes = await pdfDoc.save();

    return new Blob([pdfBytes], { type: 'application/pdf' });
}

const handleDHQHEIPDFDownload = (blob, reportDate, connectID) => {
    const url = URL.createObjectURL(blob);
    const tempEle = document.createElement('a');
    tempEle.href = url;

    const filenameDate = new Date(reportDate).toISOString().split('T')[0];
    const baseFilename = 'dhq_hei_report.pdf';
    const nameWithoutExt = baseFilename.replace('.pdf', '');
    tempEle.download = `${connectID}_${nameWithoutExt}_${filenameDate}.pdf`;

    document.body.appendChild(tempEle);
    tempEle.click();
    document.body.removeChild(tempEle);
    URL.revokeObjectURL(url);
}

const getHealthcareProviderCoordinates = (healthcareProvider, source, version, lang) => {
    let coordinates = ``;
    version = version.toUpperCase();
    if (pdfCoordinatesMap[source]) {
        if (pdfCoordinatesMap[source][healthcareProvider] &&
            pdfCoordinatesMap[source][healthcareProvider][version] &&
            pdfCoordinatesMap[source][healthcareProvider][version][lang]) {
            coordinates =  pdfCoordinatesMap[source][healthcareProvider][version][lang];
        } else if (pdfCoordinatesMap[source][healthcareProvider] &&
            pdfCoordinatesMap[source][healthcareProvider][version] && 
            Array.isArray(pdfCoordinatesMap[source][healthcareProvider][version])) {
            coordinates =  pdfCoordinatesMap[source][healthcareProvider][version];
        } else if (pdfCoordinatesMap[source]['default'][version]) {
            coordinates = pdfCoordinatesMap[source]['default'][version];
        } else {
            throw new Error('Unsupported PDF version: '+version+' for '+healthcareProvider+' '+source);
        }
    } else {
        throw new Error('Unsupported PDF source: '+source);
    } 
        
    return coordinates;  // x0/y0: date x/y: name x1/y1: signature
}

const getRevocationCoordinates = (type, version, lang) => {
    const coordinates = {
        "Data": {
            "V1.0": {
                "Eng": [{x: 150, y: 400}, {x0: 155, y0: 380}, {x1: 150, y1: 420}],
                "Span": [{x: 188, y: 385}, {x0: 88, y0: 365}, {x1: 88, y1: 410}]
            }
        },
        "HIPAA": {
            "V1.0": {
                "Eng": [{x: 150, y: 420}, {x0: 155, y0: 380}, {x1: 150, y1: 400}],
                "Span": [{x: 188, y: 410}, {x0: 88, y0: 365}, {x1: 88, y1: 385}]
            }
        }
    };
    return coordinates[type][version][lang];
}

const renderDownload = async (participant, timeStamp, fileLocation, coordinates, type) => {
    let fileLocationDownload = fileLocation.slice(2)
    const participantPrintName = createPrintName(participant, type)
    const participantSignature = createSignature(participant, type)
    let seekLastPage;
    const pdfLocation = fileLocation;
    const existingPdfBytes = await fetch(pdfLocation).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const pages = pdfDoc.getPages();
    for (let i = 0; i <= pages.length; i++) {seekLastPage = i}
    const editPage = pages[seekLastPage-1];
    editPage.drawText(`
    ${participantPrintName}`, {
                x: coordinates[0].x,
                y: coordinates[0].y,
                size: 24,
      });

    editPage.drawText(`
    ${timeStamp}`, {
                x: coordinates[1].x0,
                y: coordinates[1].y0,
                size: 24,
    });

    editPage.drawText(`
    ${participantSignature}`, {
        x: coordinates[2].x1,
        y: coordinates[2].y1,
        size: 20,
        font: helveticaFont,
      });
    
    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    download(pdfBytes, fileLocationDownload, "application/pdf");
}

const createSignature = (participant, type) => {
    const firstNameCID = type === 'hipaarevoc' ? fieldMapping.HIPAARevocFirstName : type === 'datadestruction' ? fieldMapping.dataDestructionFirstName : fieldMapping.consentFirstName;
    const firstName =  participant[firstNameCID] ? `${participant[firstNameCID]}` : '';

    const middleNameCID = type === 'hipaarevoc' ? fieldMapping.HIPAARevocMiddleName : type === 'datadestruction' ? fieldMapping.dataDestructionMiddleName : fieldMapping.consentMiddleName;
    const middleName =  participant[middleNameCID] ? ` ${participant[middleNameCID]} ` : ' ';
    
    const lastNameCID = type === 'hipaarevoc' ? fieldMapping.HIPAARevocLastName : type === 'datadestruction' ? fieldMapping.dataDestructionLastName : fieldMapping.consentLastName;
    const lastName =  participant[lastNameCID] ? `${participant[lastNameCID]}` : '';

    const suffixCID = type === 'hipaarevoc' ? fieldMapping.HIPAARevocSuffix : type === 'datadestruction' ? fieldMapping.dataDestructionSuffix : fieldMapping.consentSuffix;
    const suffix = participant[suffixCID] ? ` ${fieldMapping[participant[suffixCID]]}` : '';

    return firstName + middleName + lastName + suffix
}

const createPrintName = (participant, type) => {
    const firstNameCID = type === 'hipaarevoc' ? fieldMapping.HIPAARevocFirstName : type === 'datadestruction' ? fieldMapping.dataDestructionFirstName : fieldMapping.consentFirstName;
    const firstName =  participant[firstNameCID] ? `${participant[firstNameCID]}` : '';

    const middleNameCID = type === 'hipaarevoc' ? fieldMapping.HIPAARevocMiddleName : type === 'datadestruction' ? fieldMapping.dataDestructionMiddleName : fieldMapping.consentMiddleName;
    const middleName =  participant[middleNameCID] ? ` ${participant[middleNameCID]} ` : ' ';
    
    const lastNameCID = type === 'hipaarevoc' ? fieldMapping.HIPAARevocLastName : type === 'datadestruction' ? fieldMapping.dataDestructionLastName : fieldMapping.consentLastName;
    const lastName =  participant[lastNameCID] ? `${participant[lastNameCID]}` : '';

    const suffixCID = type === 'hipaarevoc' ? fieldMapping.HIPAARevocSuffix : type === 'datadestruction' ? fieldMapping.dataDestructionSuffix : fieldMapping.consentSuffix;
    const suffix = participant[suffixCID] ? ` ${fieldMapping[participant[suffixCID]]}` : '';

    return firstName + middleName + lastName + suffix
}


const consentHandler = (participant) => {
    let template = ``;
    participant && 
    participant[fieldMapping.consentFlag] === (fieldMapping.yes)?
    ( template += `<td><i class="fa fa-check fa-2x" style="color: green;"></i></td>
                    <td>Enrollment</td>
                    <td>Agreement</td>
                    <td>Consent</td>
                    <td>Signed</td>
                    <td>${participant[fieldMapping.consentDate] && formatUTCDate(participant[fieldMapping.consentDate])}</td>
                    <td>${participant[fieldMapping.consentVersion]}</td>
                    <td>N/A</td>
                    <td><a style="color: blue; text-decoration: underline; cursor: pointer;" target="_blank" id="downloadCopy">Download Link</a></td>
    ` ) : 
    (
        template += `<td><i class="fa fa-times fa-2x" style="color: red;"></i></td>
                    <td>Enrollment</td>
                    <td>Agreement</td>
                    <td>Consent</td>
                    <td>Not Signed</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td style="color: grey; text-decoration: underline;">Download Link</td>`
    )
    return template;

}


const hippaHandler = (participant) => {
    let template = ``;
    participant && 
    participant[fieldMapping.hippaFlag] === (fieldMapping.yes)?
    ( template += `<td><i class="fa fa-check fa-2x" style="color: green;"></i></td>
                    <td>Enrollment</td>
                    <td>Agreement</td>
                    <td>HIPAA</td>
                    <td>Signed</td>
                    <td>${participant[fieldMapping.hippaDate] && formatUTCDate(participant[fieldMapping.hippaDate])}</td>
                    <td>${participant[fieldMapping.hipaaVersion]}</td>
                    <td>N/A</td>
                    <td><a style="color: blue; text-decoration: underline; cursor: pointer;" target="_blank" id="downloadCopyHIPAA">Download Link</a></td>
    ` ) : 
    (
        template +=`<td><i class="fa fa-times fa-2x" style="color: red;"></i></td>
                    <td>Enrollment</td>
                    <td>Agreement</td>
                    <td>HIPAA</td>
                    <td>Not Signed</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td style="color: grey; text-decoration: underline;">Download Link</td>`
    )
    return template;
}

const hipaaRevocation = (participant) => {
    let template = ``;
    participant && 
    participant[fieldMapping.revokeHIPAA] === (fieldMapping.yes) ?
    ( participant[fieldMapping.signedHIPAARevoc] === fieldMapping.yes ?
        ( template += `<td><i class="fa fa-check fa-2x" style="color: green;"></i></td>
                        <td>Revocation</td>
                        <td>Agreement</td>
                        <td>HIPAA Revoc Form</td>
                        <td>Signed</td>
                        <td>${(participant[fieldMapping.dateHIPAARevoc] !== undefined) ? formatUTCDate(participant[fieldMapping.dateHIPAARevoc]) : `N/A`}</td>
                        <td>${(participant[fieldMapping.versionHIPAARevoc] !== undefined) ? participant[fieldMapping.versionHIPAARevoc] : `N/A`}</td>
                        <td>N/A</td>
                        <td><a style="color: blue; text-decoration: underline;" target="_blank" id="downloadCopyHipaaRevoc">Download Link</a></td>
        ` ) : 
        ( template += `<td><i class="fa fa-times fa-2x" style="color: red;"></i></td>
                        <td>Revocation</td>
                        <td>Agreement</td>
                        <td>HIPAA Revoc Form</td>
                        <td>Not Signed</td>
                        <td>${(participant[fieldMapping.dateHIPAARevoc] !== undefined) ? formatUTCDate(participant[fieldMapping.dateHIPAARevoc]) : `N/A`}</td>
                        <td>${(participant[fieldMapping.versionHIPAARevoc] !== undefined) ? participant[fieldMapping.versionHIPAARevoc] : `N/A`}</td>
                        <td>N/A</td>
                        <td style="color: grey; text-decoration: underline;">Download Link</td>` 
    ) ):
     (
        template +=`<td><i class="fa fa-times fa-2x" style="color: red;"></i></td>
                    <td>Revocation</td>
                    <td>Agreement</td>
                    <td>HIPAA Revoc Form</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td><a style="color: blue; text-decoration: underline;" target="_blank" id="downloadCopyHipaaRevoc">Download Link</a></td>`
    )
    return template;
}

const dataDestroy = (participant) => {
    let template = ``;
    participant && 
    participant[fieldMapping.destroyData] === (fieldMapping.yes) ?
        ( participant[fieldMapping.signedDataDestroy] === fieldMapping.yes ?
            ( template += `<td><i class="fa fa-check fa-2x" style="color: green;"></i></td>
                            <td>Destruction</td>
                            <td>Agreement</td>
                            <td>Data Destroy Form</td>
                            <td>Signed</td>
                            <td>${(participant[fieldMapping.dateDataDestroy] !== undefined) ? formatUTCDate(participant[fieldMapping.dateDataDestroy]) : `N/A`}</td>
                            <td>${(participant[fieldMapping.versionDataDestroy] !== undefined) ? participant[fieldMapping.versionDataDestroy] : `N/A` }</td>      
                            <td>N/A</td>
                            <td><a style="color: blue; text-decoration: underline;" target="_blank" id="downloadCopyDataDestroy">Download Link</a></td>
            ` ) : 
        ( template += `<td><i class="fa fa-times fa-2x" style="color: red;"></i></td>
                        <td>Destruction</td>
                        <td>Agreement</td>
                        <td>Data Destroy Form</td>
                        <td>Not Signed</td>
                        <td>${(participant[fieldMapping.dateDataDestroy] !== undefined) ? formatUTCDate(participant[fieldMapping.dateDataDestroy]) : `N/A`}</td>
                        <td>${(participant[fieldMapping.versionDataDestroy] !== undefined) ? participant[fieldMapping.versionDataDestroy] : `N/A` }</td>      
                        <td>N/A</td>
                        <td style="color: grey; text-decoration: underline;">Download Link</td>
        ` )  )
    : 
    (
        template +=`<td><i class="fa fa-times fa-2x" style="color: red;"></i></td>
                    <td>Destruction</td>
                    <td>Agreement</td>
                    <td>Data Destroy Form</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td><a style="color: blue; text-decoration: underline;" target="_blank" id="downloadCopyDataDestroy">Download Link</a></td>`
    )
    return template;
}