import fieldMapping from './fieldToConceptIdMapping.js';

export const renderRefusalOptions = () => {
  const template = `
                <div>
                    <span><h6>Reason for refusal/withdrawal (select all that apply):​</h6></span>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m no longer interested in the study​" name="options" 
                        data-optionKey=${fieldMapping.noLongerInterested} id="defaultCheck1">
                        <label class="form-check-label" for="defaultCheck1">
                            I’m no longer interested in the study​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m too busy/the study takes too much time​" name="options" 
                        data-optionKey=${fieldMapping.tooBusy} id="defaultCheck2">
                        <label class="form-check-label" for="defaultCheck2">
                            I’m too busy/the study takes too much time​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m concerned about my privacy​" name="options" 
                        data-optionKey=${fieldMapping.concernedAboutPrivacy} id="defaultCheck3">
                        <label class="form-check-label" for="defaultCheck3">
                            I’m concerned about my privacy​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m not able to complete the study activities online" name="options" 
                        data-optionKey=${fieldMapping.unableToCompleteOnlineActivites} id="defaultCheck4">
                        <label class="form-check-label" for="defaultCheck4">
                            I’m not able to complete the study activities online
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I think the payment or benefit to participate is not great enough" name="options" 
                        data-optionKey=${fieldMapping.participantGreedy} id="defaultCheck6">
                        <label class="form-check-label" for="defaultCheck6">
                        I think the payment or benefit to participate is not great enough
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m too sick/my health is too poor to participate" name="options" 
                        data-optionKey=${fieldMapping.tooSick} id="defaultCheck7">
                        <label class="form-check-label" for="defaultCheck7">
                            I’m too sick/my health is too poor to participate
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t have reliable access to the internet/a device" name="options" 
                        data-optionKey=${fieldMapping.noInternet} id="defaultCheck8">
                        <label class="form-check-label" for="defaultCheck8">
                            I don’t have reliable access to the internet/a device
                        </label>
                    </div>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t like to do things online" name="options" 
                        data-optionKey=${fieldMapping.dontLikeThingsOnline} id="defaultCheck">
                        <label class="form-check-label" for="defaultCheck">
                            I don’t like to do things online
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried about receiving results from the study" name="options" 
                        data-optionKey=${fieldMapping.worriedAboutResults} id="defaultCheck9">
                        <label class="form-check-label" for="defaultCheck9">
                            I’m worried about receiving results from the study
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried the study might find something concerning about me" name="options" 
                        data-optionKey=${fieldMapping.concernedAboutResults} id="defaultCheck10">
                        <label class="form-check-label" for="defaultCheck10">
                            I’m worried the study might find something concerning about me
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t trust the government" name="options" 
                        data-optionKey=${fieldMapping.doesntTrustGov} id="defaultCheck11">
                        <label class="form-check-label" for="defaultCheck11">
                            I don’t trust the government
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t trust research/researchers" name="options" 
                        data-optionKey=${fieldMapping.doesntTrustResearch} id="defaultCheck12">
                        <label class="form-check-label" for="defaultCheck12">
                            I don’t trust research/researchers
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I don’t want my information shared with other researchers" name="options" 
                        data-optionKey=${fieldMapping.doesntWantInfoWithResearchers} id="defaultCheck13">
                        <label class="form-check-label" for="defaultCheck13">
                            I don’t want my information shared with other researchers
                        </label>
                    </div>
                    <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="I’m worried my information isn’t secure or there will be a data breach" name="options" 
                            data-optionKey=${fieldMapping.worriedAboutDataBreach} id="defaultCheck14">
                            <label class="form-check-label" for="defaultCheck14">
                                I’m worried my information isn’t secure or there will be a data breach
                            </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried about data being given to my insurance company/effects on insurance (health, life, other)" name="options" 
                        data-optionKey=${fieldMapping.worriedAboutInsurance} id="defaultCheck15">
                        <label class="form-check-label" for="defaultCheck15">
                            I’m worried about data being given to my insurance company/effects on insurance (health, life, other)
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried about data being given to my employer/potential employer" name="options" 
                        data-optionKey=${fieldMapping.worriedAboutEmployer} id="defaultCheck16">
                        <label class="form-check-label" for="defaultCheck16">
                            I’m worried about data being given to my employer/potential employer
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried that my information could be used to discriminate against me/my family" name="options" 
                        data-optionKey=${fieldMapping.worriedAboutDiscrimination} id="defaultCheck17">
                        <label class="form-check-label" for="defaultCheck17">
                            I’m worried that my information could be used to discriminate against me/my family
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m worried that my information will be used by others to make a profit" name="options" 
                        data-optionKey=${fieldMapping.worriedAboutInformationMisue} id="defaultCheck18">
                        <label class="form-check-label" for="defaultCheck18">
                             I’m worried that my information will be used by others to make a profit
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I have other privacy concerns" name="options" 
                        data-optionKey=${fieldMapping.worriedAboutOtherPrivacyConcerns} id="defaultCheck19">
                        <label class="form-check-label" for="defaultCheck19">
                            I have other privacy concerns
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I’m concerned about COVID-19" name="options" 
                        data-optionKey=${fieldMapping.concernedAboutCovid} id="defaultCheck20">
                        <label class="form-check-label" for="defaultCheck20">
                            I’m concerned about COVID-19
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Participant is now unable to participate" name="options" 
                        data-optionKey=${fieldMapping.participantUnableToParticipate} id="defaultCheck21">
                        <label class="form-check-label" for="defaultCheck21">
                            Participant is now unable to participate
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Participant is incarcerated" name="options" 
                        data-optionKey=${fieldMapping.participantIncarcerated} id="defaultCheck22">
                        <label class="form-check-label" for="defaultCheck22">
                            Participant is incarcerated
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="I am concerned about providing information online" name="options" 
                        data-optionKey=${fieldMapping.concernedInfoOnline} id="defaultCheck22">
                        <label class="form-check-label" for="defaultCheck22">
                            I am concerned about providing information online
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Too many technical problems with MyConnect" name="options" 
                        data-optionKey=${fieldMapping.tooManyTechnicalProblems} id="tooManyTechnicalProblemsCheckbox">
                        <label class="form-check-label" for="tooManyTechnicalProblemsCheckbox">
                            Too many technical problems with MyConnect
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Reason not given" name="options" 
                        data-optionKey=${fieldMapping.reasonNotGiven}  id="defaultCheck23">
                        <label class="form-check-label" for="defaultCheck23">
                            Reason not given
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="Other reasons" name="options" data-optionKey=${fieldMapping.otherReasons} id="defaultCheck23">
                        <label class="form-check-label" for="defaultCheck23">
                            Other reasons: 
                        </label>
                        <input type="text" id="defaultCheck24" name="defaultCheck24" data-optionKey=${fieldMapping.otherReasonsSpecify}><br>
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
                    <select id="page2Month" class="form-control required-field col-md-4" data-error-required='Please select your Month.'>
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
                    <select class="form-control required-field col-md-4" data-error-required='Please select your day.' id="page2Day"></select>
                </div>
                <div class="form-group row">
                    <label class="col-md-4 col-form-label">Year</label>
                    <input type="text" class="form-control required-field input-validation col-md-4" data-error-required='Please select your year.' 
                    data-validation-pattern="year" data-error-validation="Your year must contain four digits in the YYYY format." maxlength="4" id="page2Year" list="yearsOption" title="Year, must be in 1900s" Placeholder="Enter year">
                    <datalist id="yearsOption"></datalist>
                </div>
                    </span>
                    <br />
                    <span><b> Source of Report:​ </b></span>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="Spouse/partner" 
                        data-optionKey=${fieldMapping.spouse} id="defaultCheck2">
                        <label class="form-check-label" for="defaultCheck2">
                            Spouse/partner​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="Child​" 
                        data-optionKey=${fieldMapping.child} id="defaultCheck3">
                        <label class="form-check-label" for="defaultCheck3">
                            Child​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="Other relative or proxy" 
                        data-optionKey=${fieldMapping.otherRelative} id="defaultCheck4">
                        <label class="form-check-label" for="defaultCheck4">
                            Other relative or proxy​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="IHCS Staff" 
                        data-optionKey=${fieldMapping.ihcsStaff} id="defaultCheck5">
                        <label class="form-check-label" for="defaultCheck5">
                            IHCS Staff​
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="options" value="Other" 
                        data-optionKey=${fieldMapping.other} id="defaultCheck6">
                        <label class="form-check-label" for="defaultCheck6">
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
