import fieldMapping from './fieldToConceptIdMapping.js';

export const renderRefusalOptions = () => {
  const template = `
                <div>
                    <span><h6>Reason for refusal/withdrawal (select all that apply):​</h6></span>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m no longer interested in the study​" name="options" 
                        data-optionkey=${fieldMapping.noLongerInterested} id="initialSurveyCheck">
                        <label class="form-check-label" for="initialSurveyCheck">
                            I’m no longer interested in the study​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m too busy/the study takes too much time​" name="options" 
                        data-optionkey=${fieldMapping.tooBusy} id="baselineBloodDonationCheck">
                        <label class="form-check-label" for="baselineBloodDonationCheck">
                            I’m too busy/the study takes too much time​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m concerned about my privacy​" name="options" 
                        data-optionkey=${fieldMapping.concernedAboutPrivacy} id="baselineUrineDonationCheck">
                        <label class="form-check-label" for="baselineUrineDonationCheck">
                            I’m concerned about my privacy​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m not able to complete the study activities online" name="options" 
                        data-optionkey=${fieldMapping.unableToCompleteOnlineActivites} id="baselineMouthwashDonationCheck">
                        <label class="form-check-label" for="baselineMouthwashDonationCheck">
                            I’m not able to complete the study activities online
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I think the payment or benefit to participate is not great enough" name="options" 
                        data-optionkey=${fieldMapping.paymentInsufficient} id="allFutureSurveysCheck">
                        <label class="form-check-label" for="allFutureSurveysCheck">
                        I think the payment or benefit to participate is not great enough
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m too sick/my health is too poor to participate" name="options" 
                        data-optionkey=${fieldMapping.tooSick} id="allFutureSpecimensCheck">
                        <label class="form-check-label" for="allFutureSpecimensCheck">
                            I’m too sick/my health is too poor to participate
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t have reliable access to the internet/a device" name="options" 
                        data-optionkey=${fieldMapping.noInternet} id="allFutureStudyActivitiesCheck">
                        <label class="form-check-label" for="allFutureStudyActivitiesCheck">
                            I don’t have reliable access to the internet/a device
                        </label>
                    </div>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t like to do things online" name="options" 
                        data-optionkey=${fieldMapping.dontLikeThingsOnline} id="dontLikeThingsOnlineCheck">
                        <label class="form-check-label" for="dontLikeThingsOnlineCheck">
                            I don’t like to do things online
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried about receiving results from the study" name="options" 
                        data-optionkey=${fieldMapping.worriedAboutResults} id="revokeHipaaAuthorizationCheck">
                        <label class="form-check-label" for="revokeHipaaAuthorizationCheck">
                            I’m worried about receiving results from the study
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried the study might find something concerning about me" name="options" 
                        data-optionkey=${fieldMapping.concernedAboutResults} id="withdrawConsentCheck">
                        <label class="form-check-label" for="withdrawConsentCheck">
                            I’m worried the study might find something concerning about me
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t trust the government" name="options" 
                        data-optionkey=${fieldMapping.doesntTrustGov} id="destroyDataCheck">
                        <label class="form-check-label" for="destroyDataCheck">
                            I don’t trust the government
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t trust research/researchers" name="options" 
                        data-optionkey=${fieldMapping.doesntTrustResearch} id="participantDeceasedCheck">
                        <label class="form-check-label" for="participantDeceasedCheck">
                            I don’t trust research/researchers
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t want my information shared with other researchers" name="options" 
                        data-optionkey=${fieldMapping.doesntWantInfoWithResearchers} id="doesntWantInfoSharedWithResearchers">
                        <label class="form-check-label" for="doesntWantInfoSharedWithResearchers">
                            I don’t want my information shared with other researchers
                        </label>
                    </div>
                    <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="I’m worried my information isn’t secure or there will be a data breach" name="options" 
                            data-optionkey=${fieldMapping.worriedAboutDataBreach} id="worriedAboutDataBreach">
                            <label class="form-check-label" for="worriedAboutDataBreach">
                                I’m worried my information isn’t secure or there will be a data breach
                            </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried about data being given to my insurance company/effects on insurance (health, life, other)" name="options" 
                        data-optionkey=${fieldMapping.worriedAboutInsurance} id="worriedAboutInsurance">
                        <label class="form-check-label" for="worriedAboutInsurance">
                            I’m worried about data being given to my insurance company/effects on insurance (health, life, other)
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried about data being given to my employer/potential employer" name="options" 
                        data-optionkey=${fieldMapping.worriedAboutEmployer} id="worriedAboutEmployer">
                        <label class="form-check-label" for="worriedAboutEmployer">
                            I’m worried about data being given to my employer/potential employer
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried that my information could be used to discriminate against me/my family" name="options" 
                        data-optionkey=${fieldMapping.worriedAboutDiscrimination} id="worriedAboutDiscrimination">
                        <label class="form-check-label" for="worriedAboutDiscrimination">
                            I’m worried that my information could be used to discriminate against me/my family
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried that my information will be used by others to make a profit" name="options" 
                        data-optionkey=${fieldMapping.worriedAboutInformationMisue} id="worriedAboutInformationMisue">
                        <label class="form-check-label" for="worriedAboutInformationMisue">
                             I’m worried that my information will be used by others to make a profit
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I have other privacy concerns" name="options" 
                        data-optionkey=${fieldMapping.worriedAboutOtherPrivacyConcerns} id="worriedAboutOtherPrivacyConcerns">
                        <label class="form-check-label" for="worriedAboutOtherPrivacyConcerns">
                            I have other privacy concerns
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m concerned about COVID-19" name="options" 
                        data-optionkey=${fieldMapping.concernedAboutCovid} id="concernedAboutCovid">
                        <label class="form-check-label" for="concernedAboutCovid">
                            I’m concerned about COVID-19
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Participant is now unable to participate" name="options" 
                        data-optionkey=${fieldMapping.participantUnableToParticipate} id="participantUnableToParticipate">
                        <label class="form-check-label" for="participantUnableToParticipate">
                            Participant is now unable to participate
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Participant is incarcerated" name="options" 
                        data-optionkey=${fieldMapping.participantIncarcerated} id="participantIncarcerated">
                        <label class="form-check-label" for="participantIncarcerated">
                            Participant is incarcerated
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I am concerned about providing information online" name="options" 
                        data-optionkey=${fieldMapping.concernedInfoOnline} id="concernedInfoOnline">
                        <label class="form-check-label" for="concernedInfoOnline">
                            I am concerned about providing information online
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Too many technical problems with MyConnect" name="options" 
                        data-optionkey=${fieldMapping.tooManyTechnicalProblems} id="tooManyTechnicalProblemsCheckbox">
                        <label class="form-check-label" for="tooManyTechnicalProblemsCheckbox">
                            Too many technical problems with MyConnect
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Reason not given" name="options" 
                        data-optionkey=${fieldMapping.reasonNotGiven}  id="reasonNotGiven">
                        <label class="form-check-label" for="reasonNotGiven">
                            Reason not given
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Other reasons" name="options" data-optionkey=${fieldMapping.otherReasons} id="otherReasons">
                        <label class="form-check-label" for="otherReasons">
                            Other reasons: 
                        </label>
                        <input type="text" id="otherReasonsInput" name="otherReasonsInput" data-optionkey=${fieldMapping.otherReasonsSpecify}><br>
                    </div>
                </div> 
                <div style="display:inline-block; margin-top:20px;">
                    <button type="button" id="backToPrevPage" class="btn btn-primary">Previous</button>
                    <button type="button" id="submit" class="btn btn-success">Submit</button>
                </div>
            `;
    return template;
}

export const renderCauseOptions = () => {
    const template = `
            <div>
                    <span> Date of Death:
                    <div class="form-group row">
                    <label class="col-md-4 col-form-label">Month</label>
                    <select id="causeOfDeathMonth" class="form-control required-field col-md-4" data-error-required='Please select your Month.'>
                        <option class="option-dark-mode" value="">Select month</option>
                        <option class="option-dark-mode" value="01">1 - January</option>
                        <option class="option-dark-mode" value="02">2 - February</option>
                        <option class="option-dark-mode" value="03">3 - March</option>
                        <option class="option-dark-mode" value="04">4 - April</option>
                        <option class="option-dark-mode" value="05">5 - May</option>
                        <option class="option-dark-mode" value="06">6 - June</option>
                        <option class="option-dark-mode" value="07">7 - July</option>
                        <option class="option-dark-mode" value="08">8 - August</option>
                        <option class="option-dark-mode" value="09">9 - September</option>
                        <option class="option-dark-mode" value="10">10 - October</option>
                        <option class="option-dark-mode" value="11">11 - November</option>
                        <option class="option-dark-mode" value="12">12 - December</option>
                    </select>
                </div>
                <div class="form-group row">
                    <label class="col-md-4 col-form-label">Day</label>
                    <select class="form-control required-field col-md-4" data-error-required='Please select your day.' id="causeOfDeathDay"></select>
                </div>
                <div class="form-group row">
                    <label class="col-md-4 col-form-label">Year</label>
                    <input type="text" class="form-control required-field input-validation col-md-4" data-error-required='Please select your year.' 
                    data-validation-pattern="year" data-error-validation="Your year must contain four digits in the YYYY format." maxlength="4" id="causeOfDeathYear" list="yearsOption" title="Year, must be in 1900s" Placeholder="Enter year">
                    <datalist id="yearsOption"></datalist>
                </div>
                    </span>
                    <br />
                    <span><b> Source of Report:​ </b></span>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="Spouse/partner" 
                        data-optionkey=${fieldMapping.spouse} id="baselineBloodDonationCheck">
                        <label class="form-check-label" for="baselineBloodDonationCheck">
                            Spouse/partner​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="Child​" 
                        data-optionkey=${fieldMapping.child} id="baselineUrineDonationCheck">
                        <label class="form-check-label" for="baselineUrineDonationCheck">
                            Child​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="Other relative or proxy" 
                        data-optionkey=${fieldMapping.otherRelative} id="baselineMouthwashDonationCheck">
                        <label class="form-check-label" for="baselineMouthwashDonationCheck">
                            Other relative or proxy​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="IHCS Staff" 
                        data-optionkey=${fieldMapping.ihcsStaff} id="baselineSpecimenSurveyCheck">
                        <label class="form-check-label" for="baselineSpecimenSurveyCheck">
                            IHCS Staff​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="Other" 
                        data-optionkey=${fieldMapping.other} id="allFutureSurveysCheck">
                        <label class="form-check-label" for="allFutureSurveysCheck">
                            Other
                        </label>
                    </div>
             </div>
            <div style="display:inline-block; margin-top:20px;">
                <button type="button" id="backToPrevPage" class="btn btn-primary">Previous</button>
                <button type="button" id="submit" class="btn btn-success">Submit</button>
            </div>
            `;
    return template;
}
