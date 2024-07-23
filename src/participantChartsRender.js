export const renderAllCharts = (inputData) => {
    const {activeRecruitsFunnel, passiveRecruitsFunnel, totalRecruitsFunnel, activeCurrentWorkflow, passiveCurrentWorkflow, totalCurrentWorkflow, genderStats, raceStats, ageStats, activeVerificationStatus, passiveVerificationStatus, denominatorVerificationStatus, recruitsCount, modulesStats, ssnStats, optOutsStats, biospecimenStats} = inputData;
    const chartsLayoutHTML = `
    <div class="row">
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="funnelChart">${renderLabel(recruitsCount.activeCount, "Active")}</div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="barChart">${renderLabel(recruitsCount.activeCount, "Active")}</div>
        </div>
        <div class = "col-lg-4 charts">
                <div class="col-lg-12 sub-div-shadow viz-div" id="activeOptouts"></div>
        </div>
    </div>
    <div class="row">
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="passiveFunnelChart">${renderLabel(recruitsCount.passiveCount, "Passive")}</div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="passiveBarChart">${renderLabel(recruitsCount.passiveCount, "Passive")}</div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="passiveCounts"></div>
        </div>
    </div>
    <div class="row">
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="totalFunnelChart">${renderLabel(recruitsCount.activeCount + recruitsCount.passiveCount, "Total")}</div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="totalBarChart">${renderLabel(recruitsCount.activeCount + recruitsCount.passiveCount, "Total")}</div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="totalCounts"></div>
        </div>
    </div>
    <div class="row">
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="activeVerificationStatus"></div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="passiveVerificationStatus"></div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="placeHolder"></div>
        </div>
    </div>
    <div class="row">
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="ageMetrics"></div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="raceMetrics"></div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="sexMetrics"></div>
        </div>
    </div>
    <div class="row">
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="moduleMetrics"></div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="ssnMetrics"></div>
        </div>
        <div class = "col-lg-4 charts">
            <div class="col-lg-12 sub-div-shadow viz-div" id="biospecimenMetrics"></div>
        </div>
    </div>
    `;

    const mainContent = document.getElementById('mainContent');
    const metricsCards = metricsCardsView({
      activeRecruits: recruitsCount.activeCount,
      passiveRecruits: recruitsCount.passiveCount,
      verifiedParticipants: activeVerificationStatus.verified + passiveVerificationStatus.verified,
      allModulesBlood: modulesStats.allModulesBlood,
    });
    mainContent.appendChild(metricsCards);

    const tempDiv= document.createElement('div');
    tempDiv.innerHTML = chartsLayoutHTML;
    mainContent.append(...tempDiv.children);

   renderAgeMetrics(ageStats, 'ageMetrics');
   renderRaceMetrics(raceStats, 'raceMetrics');
   renderSexMetrics(genderStats, 'sexMetrics');
   renderActiveFunnelChart(activeRecruitsFunnel, 'funnelChart')
   renderActiveBarChart(activeCurrentWorkflow, 'barChart');
   renderActiveOptouts(optOutsStats, recruitsCount.activeCount, 'activeOptouts');
   renderPassiveFunnelChart(passiveRecruitsFunnel, 'passiveFunnelChart');
   renderPassiveBarChart(passiveCurrentWorkflow, 'passiveBarChart');
   renderTotalFunnelChart(totalRecruitsFunnel, 'totalFunnelChart');
   renderTotalCurrentWorkflow(totalCurrentWorkflow, 'totalBarChart');
   renderActiveVerificationStatus(activeVerificationStatus, denominatorVerificationStatus, 'activeVerificationStatus');
   renderPassiveVerificationStatus(passiveVerificationStatus, denominatorVerificationStatus, 'passiveVerificationStatus');
   renderModuleChart(modulesStats, 'moduleMetrics');
   renderSsnChart(ssnStats, 'ssnMetrics');
   renderBiospecimenChart(biospecimenStats, ssnStats.verifiedParticipants, 'biospecimenMetrics');
}

const metricsCardsView = ({activeRecruits, passiveRecruits, verifiedParticipants, allModulesBlood}) => {
    const template = `
    <div class="metrics-card">
      <div class="card-top"></div>
      <div class="metrics-value">${activeRecruits}</div>
        <p class="metrics-value-description">
          Active Recruits
        </p>
    </div>
    <div class="metrics-card">
      <div class="card-top"></div>
      <div class="metrics-value">${verifiedParticipants}</div>
        <p class="metrics-value-description">Verified Participants</p>
      <p class="ratio-value">
      <span class="hovertext" data-hover="out of Active and Passive Recruits">      
          Response Ratio:</span>
          ${activeRecruits + passiveRecruits === 0 || verifiedParticipants === 0 ? 0 : `${(verifiedParticipants / (activeRecruits + passiveRecruits) * 100).toFixed(1)}%`}
      </p>
    </div>
    <div class="metrics-card">
      <div class="card-top"></div>
      <div class="metrics-value">${allModulesBlood}</div>
        <p class="metrics-value-description"><span class="hovertext" data-hover="All 4 Initial Survey Sections + Blood Collection">Verified Participants who Completed Baseline Survey and Blood Sample</span></p>
        <p class="ratio-value">Completion Ratio: ${verifiedParticipants === 0 || allModulesBlood === 0 ? 0 : `${(allModulesBlood / verifiedParticipants * 100).toFixed(1)}%`}</p>
    </div>`;
    const rowDiv = document.createElement("div");
    rowDiv.className = "row d-flex justify-content-center";
    rowDiv.innerHTML = template;
    return rowDiv;
 };

const renderLabel = (count, recruitType) => {
    let template = ``;
    if (["Active", "Passive", "Total"].includes(recruitType)) {
        template = `<span class="badge bg-primary" style="color:white">${recruitType} Recruits: ${count}</span>`;
    }

    return template;
}

const renderActiveFunnelChart = (activeRecruitsFunnel, id) => {
    const signIn =  activeRecruitsFunnel.signedIn
    const consent = activeRecruitsFunnel.consented;
    const userProfile =  activeRecruitsFunnel.submittedProfile
    const verification = activeRecruitsFunnel.verification
    const verified = activeRecruitsFunnel.verified
    
        const data = [{
            x: [signIn, consent, userProfile, verification, verified],
            y: ['Signed In', 'Consented', 'Profile Done', 'Verification', 'Verified'],
            type: 'funnel',
            textinfo: 'hello ${23}', 
            marker: {
                color: ["#0C1368", "#242C8F", "#525DE9", '#008ECC', '#6593F5']
            }
        }];
    
        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            title: `Cumulative Status`
        };
    
        Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
    }


const renderActiveBarChart = (activeCurrentWorkflow, id) => {
    const notSignedIn = activeCurrentWorkflow.notSignedIn;
    const signedInNotConsented = activeCurrentWorkflow.signedIn;
    const consentedNotSubmitted = activeCurrentWorkflow.consented;
    const submittedVerificationNotCompleted = activeCurrentWorkflow.submittedProfile;
    const verificationCompleted = activeCurrentWorkflow.verification;
    const trace1 = {
        x: ['Never Signed In', 'Signed In, No Consent', 'Consented, No Profile', 'Profile, Verified Not Complete', 'Verification Complete'],
        y: [notSignedIn, signedInNotConsented, consentedNotSubmitted, submittedVerificationNotCompleted, verificationCompleted],
        name: 'Completed',
        type: 'bar'
    };

    const data = [trace1];

    const layout = {
        barmode: 'stack',
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        yaxis: {
            automargin: true,
            fixedrange: true
        },
        xaxis: {
            automargin: true,
            fixedrange: true
        },
       // colorway: ['#7f7fcc', '#0C1368', '#525DE9', '#008ECC'],
        title: 'Current Status in Workflow'
    };

    Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
}

const renderPassiveFunnelChart = (passiveRecruitsFunnel, id) => {
    
    const signIn =  passiveRecruitsFunnel.signedIn
    const consent = passiveRecruitsFunnel.consented;
    const userProfile =  passiveRecruitsFunnel.submittedProfile
    const verification = passiveRecruitsFunnel.verification
    const verified = passiveRecruitsFunnel.verified

        const data = [{
            x: [signIn, consent, userProfile, verification, verified],
            y: ['Signed In', 'Consented', 'Profile Done', 'Verification', 'Verified'],
            type: 'funnel',
            marker: {
                color: ["#0C1368", "#242C8F", "#525DE9", '#008ECC', '#6593F5']
            }
        }];
    
        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };
    
        Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
};

const renderActiveOptouts = (optOuts, recruitsCount, id) => {
    let template = ``;
    template += `
        ${renderLabel(recruitsCount, 'Active')}
        <span style="text-align: center;"><h5>Opt Outs</h5></span>
        <center><h4><b>Total Opt Out: ${optOuts.totalOptOuts}</b></h4></center>`
    document.getElementById(id).innerHTML = template
}

const renderPassiveBarChart = (passiveCurrentWorkflow, id) => {
    const notSignedIn = passiveCurrentWorkflow.notSignedIn;
    const signedInNotConsented = passiveCurrentWorkflow.signedIn;
    const consentedNotSubmitted = passiveCurrentWorkflow.consented;
    const submittedVerificationNotCompleted = passiveCurrentWorkflow.submittedProfile;
    const verificationCompleted = passiveCurrentWorkflow.verification;
    const trace1 = {
        x: ['Never Signed In', 'Signed In, No Consent', 'Consented, No Profile', 'Profile, Verified Not Complete', 'Verification Complete'],
        y: [notSignedIn, signedInNotConsented, consentedNotSubmitted, submittedVerificationNotCompleted, verificationCompleted],
        name: 'Completed',
        type: 'bar'
    };

    const data = [trace1];

    const layout = {
        barmode: 'stack',
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        yaxis: {
            automargin: true,
            fixedrange: true
        },
        xaxis: {
            automargin: true,
            fixedrange: true
        },
       // colorway: ['#7f7fcc', '#0C1368', '#525DE9', '#008ECC'],
    };

    Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });

}

const renderTotalFunnelChart = (totalRecruitsFunnel, id) => {
    const signIn =  totalRecruitsFunnel.signedIn
    const consent = totalRecruitsFunnel.consented;
    const userProfile =  totalRecruitsFunnel.submittedProfile
    const verified = totalRecruitsFunnel.verified
    const verification = totalRecruitsFunnel.verification
    
        const data = [{
            x: [signIn, consent, userProfile, verification, verified],
            y: ['Signed In', 'Consented', 'Profile Done', 'Verification', 'Verified'],
            type: 'funnel',
            marker: {
                color: ["#0C1368", "#242C8F", "#525DE9", '#008ECC', '#6593F5']
            }
        }];
    
        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
        };
    
        Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
};


const renderTotalCurrentWorkflow = (totalCurrentWorkflow, id) => {
    const notSignedIn = totalCurrentWorkflow.notSignedIn;
    const signedInNotConsented = totalCurrentWorkflow.signedIn;
    const consentedNotSubmitted = totalCurrentWorkflow.consented;
    const submittedVerificationNotCompleted = totalCurrentWorkflow.submittedProfile;
    const verificationCompleted = totalCurrentWorkflow.verification;
    const trace1 = {
        x: ['Never Signed In', 'Signed In, No Consent', 'Consented, No Profile', 'Profile, Verified Not Complete', 'Verification Complete'],
        y: [notSignedIn, signedInNotConsented, consentedNotSubmitted, submittedVerificationNotCompleted, verificationCompleted],
        name: 'Completed',
        type: 'bar'
    };

    const data = [trace1];

    const layout = {
        barmode: 'stack',
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        yaxis: {
            automargin: true,
            fixedrange: true
        },
        xaxis: {
            automargin: true,
            fixedrange: true
        },
    };

    Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });

}

const renderAgeMetrics = (ageMetrics, id) => {
    const verifiedParticipants = ageMetrics.verifiedParticipants ? ageMetrics.verifiedParticipants : 0

    const participantAgeRange1 = ageMetrics['30-34'] !== undefined ? ageMetrics['30-34'] : 0;
    const participantAgeRange2 = ageMetrics['35-39'] !== undefined ? ageMetrics['35-39'] : 0;
    const participantAgeRange3 = ageMetrics['40-45'] !== undefined ? ageMetrics['40-45'] : 0;
    const participantAgeRange4 = ageMetrics['46-50'] !== undefined ? ageMetrics['46-50'] : 0;
    const participantAgeRange5 = ageMetrics['51-55'] !== undefined ? ageMetrics['51-55'] : 0;
    const participantAgeRange6 = ageMetrics['56-60'] !== undefined ? ageMetrics['56-60'] : 0;
    const participantAgeRange7 = ageMetrics['61-65'] !== undefined ? ageMetrics['61-65'] : 0;
    const participantAgeRange8 = ageMetrics['66-70'] !== undefined ? ageMetrics['66-70'] : 0;

    const participantAgeRangeResponse1 = ((participantAgeRange1)/(verifiedParticipants)*100).toFixed(1);
    const participantAgeRangeResponse2 = ((participantAgeRange2)/(verifiedParticipants)*100).toFixed(1);
    const participantAgeRangeResponse3 = ((participantAgeRange3)/(verifiedParticipants)*100).toFixed(1);
    const participantAgeRangeResponse4 = ((participantAgeRange4)/(verifiedParticipants)*100).toFixed(1);
    const participantAgeRangeResponse5 = ((participantAgeRange5)/(verifiedParticipants)*100).toFixed(1);
    const participantAgeRangeResponse6 = ((participantAgeRange6)/(verifiedParticipants)*100).toFixed(1);
    const participantAgeRangeResponse7 = ((participantAgeRange7)/(verifiedParticipants)*100).toFixed(1);
    const participantAgeRangeResponse8 = ((participantAgeRange8)/(verifiedParticipants)*100).toFixed(1);

    let data = [{
        values: [participantAgeRangeResponse1, participantAgeRangeResponse2, participantAgeRangeResponse3, participantAgeRangeResponse4, participantAgeRangeResponse5, participantAgeRangeResponse6, participantAgeRangeResponse7, participantAgeRangeResponse8],
        labels: [   `30-34: N = ${participantAgeRange1}`, 
                    `35-39: N = ${participantAgeRange2}`,
                    `40-45: N = ${participantAgeRange3}`, 
                    `46-50: N = ${participantAgeRange4}`, 
                    `51-55: N = ${participantAgeRange5}`,
                    `56-60: N = ${participantAgeRange6}`, 
                    `61-65: N = ${participantAgeRange7}`,
                    `66-70: N = ${participantAgeRange8}`
                ],
        hoverinfo: 'label+value',
        type: 'pie'
      }];
      
      const layout = {
        showlegend: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `Age of Verified Participants <br> N = ${verifiedParticipants}`,
        legend: {
            orientation: 'h', // 'v' for vertical, 'h' for horizontal
            x: 1,
            y: -1,
            xanchor: 'right',
            yanchor: 'bottom',
        },
        height: 300, // Adjust the height to increase diameter
    };

      Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
  }

  const renderRaceMetrics = (raceMetrics, id) => {
    const verifiedParticipants = raceMetrics.verifiedParticipants ? raceMetrics.verifiedParticipants : 0

    const participantW = raceMetrics['white'] !== undefined ? raceMetrics['white'] : 0
    const participantO = raceMetrics['other']  !== undefined ? raceMetrics['other'] : 0
    const participantU = raceMetrics['unavailable'] !== undefined ? raceMetrics['unavailable'] : 0
   
    const participantRaceResponse1 = ((participantW)/(verifiedParticipants)*100).toFixed(1)
    const participantRaceResponse2 = ((participantO)/(verifiedParticipants)*100).toFixed(1)
    const participantRaceResponse3 = ((participantU)/(verifiedParticipants)*100).toFixed(1)


    let data = [{
        values: [participantRaceResponse1, participantRaceResponse2, participantRaceResponse3],
        labels: [ `White/Non-Hispanic: N=${participantW}`, 
                    `Other: N=${participantO}`, 
                    `Unavailable: N=${participantU}`],
        hoverinfo: 'label+value',
        type: 'pie'
      }];
      
    const layout = {
        showlegend: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `Race/Ethnicity of Verified Participants <br> N = ${verifiedParticipants}`
    };

      Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
  }

  const renderSexMetrics = (sexMetrics, id) => {

    const verifiedParticipants = sexMetrics.verifiedParticipants ? sexMetrics.verifiedParticipants : 0

    const participantM = sexMetrics['male'] !== undefined ? sexMetrics['male'] : 0
    const participantF = sexMetrics['female'] !== undefined ? sexMetrics['female'] : 0
    const participantI = sexMetrics['intersex'] !== undefined ? sexMetrics['intersex'] : 0
    const participantU = sexMetrics['unavailable'] !== undefined ? sexMetrics['unavailable'] : 0

    const participantSexResponse1 = ((participantM)/(verifiedParticipants)*100).toFixed(1)
    const participantSexResponse2 = ((participantF)/(verifiedParticipants)*100).toFixed(1)
    const participantSexResponse3 = ((participantI)/(verifiedParticipants)*100).toFixed(1)
    const participantSexResponse4 = ((participantU)/(verifiedParticipants)*100).toFixed(1)

    let data = [{
        values: [participantSexResponse1, participantSexResponse2, participantSexResponse3, participantSexResponse4],
        labels: [   `Male: N=${participantM}`, 
                    `Female: N=${participantF}`, 
                    `Intersex or Other: N=${participantI}`,
                    `Unavailable: N=${participantU}`],
        hoverinfo: 'label+value',
        type: 'pie'
      }];
      
      const layout = {
        showlegend: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `Sex of Verified Participants N = ${verifiedParticipants}`
    };

      Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
  }


const renderActiveVerificationStatus = (activeVerificationStatus, denominatorVerificationStatus, id) => {
    const notYetVerified =  activeVerificationStatus.notYetVerified 
                            ? ((activeVerificationStatus.notYetVerified)/(denominatorVerificationStatus.activeDenominator)*100).toFixed(1) : 0
    const verified = activeVerificationStatus.verified 
                        ? ((activeVerificationStatus.verified)/(denominatorVerificationStatus.activeDenominator)*100).toFixed(1) : 0
    const cannotBeVerified =  activeVerificationStatus.cannotBeVerified 
                        ? ((activeVerificationStatus.cannotBeVerified)/(denominatorVerificationStatus.activeDenominator)*100).toFixed(1) : 0
    const duplicate = activeVerificationStatus.duplicate 
                        ? ((activeVerificationStatus.duplicate)/(denominatorVerificationStatus.activeDenominator)*100).toFixed(1) : 0
    const outreachTimedOut = activeVerificationStatus.outreachTimedout 
                        ? ((activeVerificationStatus.outreachTimedout)/(denominatorVerificationStatus.activeDenominator)*100).toFixed(1) : 0
    let data = [{
        values: [notYetVerified, verified, cannotBeVerified, duplicate, outreachTimedOut],
        labels: [ `Not Yet Verified: N=${activeVerificationStatus.notYetVerified} `, 
                    `Verified: N=${activeVerificationStatus.verified }`, 
                    `Cannot be Verified: N=${activeVerificationStatus.cannotBeVerified }`,
                    `Duplicate: N=${0}`, 
                    `Outreach Maxed Out: N=${activeVerificationStatus.outreachTimedout }`],
        hoverinfo: 'label+value',
        type: 'pie'
      }];
      
      const layout = {
        showlegend: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `Active Recruits Verification Status among those with <br> Profile Completed N=${denominatorVerificationStatus.activeDenominator - activeVerificationStatus.duplicate }`,
        text: 'among those with Profile Completed'
    };

      Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
  }

  const renderPassiveVerificationStatus = (passiveVerificationStatus, denominatorVerificationStatus, id) => {
    const notYetVerified =  passiveVerificationStatus.notYetVerified 
                            ? ((passiveVerificationStatus.notYetVerified)/(denominatorVerificationStatus.passiveDenominator)*100).toFixed(1) : 0
    const verified = passiveVerificationStatus.verified 
                        ? ((passiveVerificationStatus.verified)/(denominatorVerificationStatus.passiveDenominator)*100).toFixed(1) : 0           
    const cannotBeVerified =  passiveVerificationStatus.cannotBeVerified 
                        ? ((passiveVerificationStatus.cannotBeVerified)/(denominatorVerificationStatus.passiveDenominator)*100).toFixed(1) : 0
    const duplicate = passiveVerificationStatus.duplicate 
                        ? ((passiveVerificationStatus.duplicate)/(denominatorVerificationStatus.passiveDenominator)*100).toFixed(1) : 0
    const outreachTimedOut = passiveVerificationStatus.outreachTimedout 
                        ? ((passiveVerificationStatus.outreachTimedout)/(denominatorVerificationStatus.passiveDenominator)*100).toFixed(1) : 0
    let data = [{
        values: [notYetVerified, verified, cannotBeVerified, duplicate, outreachTimedOut],

        labels: [ `Not Yet Verified: N=${passiveVerificationStatus.notYetVerified }`, 
                `Verified: N=${passiveVerificationStatus.verified}`, 
                `Cannot be Verified: N=${passiveVerificationStatus.cannotBeVerified}`,
                `Duplicate: N=${passiveVerificationStatus.duplicate}`, 
                `Outreach Maxed Out: N=${passiveVerificationStatus.outreachTimedout }`],
        hoverinfo: 'label+value',
        type: 'pie'
      }];

      const layout = {
        showlegend: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `Passive Recruits Verification Status among those with <br> Profile Completed N=${denominatorVerificationStatus.passiveDenominator}`
    };
      
      Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
  }

  const renderModuleChart = (modulesSurvey, id) => {
    const verifiedParticipants = modulesSurvey.verifiedParticipants ? modulesSurvey.verifiedParticipants : 0
    const noModulesSubmitted =  modulesSurvey.noModulesSubmitted ? ((modulesSurvey.noModulesSubmitted)/(verifiedParticipants)*100).toFixed(1) : 0
    const moduleOneSubmitted = modulesSurvey.moduleOneSubmitted ? ((modulesSurvey.moduleOneSubmitted)/(verifiedParticipants)*100).toFixed(1) : 0
    const modulesTwoThreeSubmitted =  modulesSurvey.modulesTwoThreeSubmitted ? ((modulesSurvey.modulesTwoThreeSubmitted)/(verifiedParticipants)*100).toFixed(1) : 0
    const modulesSubmitted = modulesSurvey.modulesSubmitted ? ((modulesSurvey.modulesSubmitted)/(verifiedParticipants)*100).toFixed(1) : 0
       let data = [{
        values: [noModulesSubmitted, moduleOneSubmitted, modulesTwoThreeSubmitted, modulesSubmitted],

        labels: [ `None: N=${modulesSurvey.noModulesSubmitted }`, 
                `BOH only: N=${modulesSurvey.moduleOneSubmitted}`, 
                `2 or 3 sections : N=${modulesSurvey.modulesTwoThreeSubmitted}`, 
                `All: N=${modulesSurvey.modulesSubmitted}`],
        hoverinfo: 'label+value',
        type: 'pie'
      }];

      const layout = {
        showlegend: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `Completion of Initial Survey among verified <br> participants N=${verifiedParticipants}`
    };
      
      Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
  }

  const renderSsnChart = (ssnSurvey, id) => {
        const verifiedParticipants = ssnSurvey.verifiedParticipants ? ssnSurvey.verifiedParticipants : 0
        const noSsnFlag =  ssnSurvey.ssnNoFlagCounter ? ((ssnSurvey.ssnNoFlagCounter)/(verifiedParticipants)*100).toFixed(1) : 0
        const ssnFullFlag = ssnSurvey.ssnFullFlagCounter ? ((ssnSurvey.ssnFullFlagCounter)/(verifiedParticipants)*100).toFixed(1) : 0
        const ssnHalfFlag =  ssnSurvey.ssnHalfFlagCounter ? ((ssnSurvey.ssnHalfFlagCounter)/(verifiedParticipants)*100).toFixed(1) : 0
    
       let data = [{
        values: [noSsnFlag, ssnFullFlag, ssnHalfFlag],

        labels: [ `0 digits given: N=${ssnSurvey.ssnNoFlagCounter}`, 
                `Full SSN given: N=${ssnSurvey.ssnFullFlagCounter}`, 
                `Partial digits: N=${ssnSurvey.ssnHalfFlagCounter}`],
        hoverinfo: 'label+value',
        type: 'pie'
      }];

      const layout = {
        showlegend: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: `Completion of SSN among verified <br> participants N=${verifiedParticipants}`
    };
      
    Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
  }
 
  const renderBiospecimenChart = (biospecimenMetrics, verifiedPts, id) => {
    const verifiedParticipants =  verifiedPts ? verifiedPts : 0

    const all =  biospecimenMetrics.all
    const none =  biospecimenMetrics.none
    const bloodUrine = biospecimenMetrics.bloodUrine
    const bloodMouthwash =  biospecimenMetrics.bloodMouthwash
    const urineMouthwash =  biospecimenMetrics.urineMouthwash
    const blood = biospecimenMetrics.blood
    const mouthwash =  biospecimenMetrics.mouthwash
    const urine =  biospecimenMetrics.urine

    const trace1 = {
        x: ['None', 'Blood only', 'Urine only', 'Mouthwash only', 'Blood/Urine only', 'Urine/Mouthwash only', 'Blood/Mouthwash only', 'All'],
        y: [none, blood, urine, mouthwash, bloodUrine, urineMouthwash, bloodMouthwash, all],
        type: 'bar',
    };
    
    const data = [trace1];
    

    const layout = {
        barmode: 'stack',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        yaxis: {
            automargin: true,
            fixedrange: true
        },
        xaxis: {
            automargin: true,
            fixedrange: true
        },
        title: `Baseline biospecimens collected among <br> verified participants N=${verifiedParticipants}`
    };
      
    Plotly.newPlot(id, data, layout, { responsive: true, displayModeBar: false });
  }