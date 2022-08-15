/**
 * @author samuelf@nebulaconsulting.co.uk
 * @date 12/07/2022
 */

import {LightningElement, api, track} from 'lwc';
import sObjectTypeExists from '@salesforce/apex/TriggerMetadataManagerModalController.sObjectTypeExists';
import getApexClassDetails from '@salesforce/apex/TriggerMetadataManagerModalController.getApexClassDetails';
import createNewMetadata from '@salesforce/apex/TriggerMetadataManagerController.createNewMetadata';
import developerNameExistsAlready
    from '@salesforce/apex/TriggerMetadataManagerModalController.developerNameExistsAlready';
import {ShowToastEvent} from "lightning/platformShowToastEvent";

export default class TriggerMetadataManagerNewModal extends LightningElement {

    @api selectedSObjectType;
    @api selectedEventType;
    @api allMetadata = [];
    @api recordId;
    @api isClone;
    metadataAlreadyExists;
    classIsJsonEnabled = false;
    jsonEnabledWarningVisible = false;
    submitClicked = false;
    @track data = {
        isActive: {value: true},
        order: {
            value: 0,
            validatorFunction: this.handleOrderCheck
        },
        label: {validatorFunction: this.handleLabelCheck},
        developerName: {
            validatorFunction: this.handleDeveloperNameCheck,
            validityErrorMessage: 'This name must be unique, be at least 3 characters and start with a letter'
        },
        description: {
            validatorFunction: this.handleDescriptionCheck,
            validityErrorMessage: 'Description cannot be left blank'
        },
        sObjectType: {validityErrorMessage: 'This SObject Type does not exist, please check your spelling'},
        apexClass: {
            validityErrorMessage: 'This apex class does not exist or does not implement the correct interface, please check your spelling',
            help: 'The apex class must implement the correct interface for the Trigger event type, i.e. nebc.BeforeInsert'
        },
        parameters: {
            validatorFunction: this.handleParametersCheck,
            validityErrorMessage: 'Parameters must be in a valid JSON format'
        },
        event: {
            validatorFunction: this.handleEventCheck,
            validityErrorMessage: 'You must select a trigger event'
        }
    };

    get label() {
        if (this.isClone) {
            return 'Clone';
        } else {
            return this.recordId ? 'Edit' : 'Create New';
        }
    }

    connectedCallback() {
        if (this.recordId) {

            this.setRecordValuesForEditClone();

            getApexClassDetails({apexClassName: this.data.apexClass.value, event: this.data.event.value})
                .then(data => {
                    this.classIsJsonEnabled = data.isJSONEnabled;
                })
                .catch(error => this.showErrorToast(error));
        }

        for (let key in this.data) {
            this.data[key].validated = key === 'isActive';
        }

        if (this.isClone) {
            this.recordId = undefined;
        }

        this.setSObjectAndEventFromFilters();

    }

    setRecordValuesForEditClone(){
        const metadataRecord = this.allMetadata.find(item => {
            return item.Id === this.recordId;
        });
        this.data.isActive.value = metadataRecord.nebc__Active__c;
        this.data.order.value = metadataRecord.nebc__Order__c;
        this.data.label.value = metadataRecord.MasterLabel;
        this.data.developerName.value = metadataRecord.DeveloperName;
        this.data.description.value = metadataRecord.nebc__Description__c;
        this.selectedSObjectType = metadataRecord.nebc__SObject__c;
        this.data.apexClass.value = metadataRecord.nebc__Apex_Class__c;
        this.data.parameters.value = metadataRecord.nebc__Parameters__c;
        this.selectedEventType = metadataRecord.nebc__Event__c;

    }

    setSObjectAndEventFromFilters(){
        if (this.selectedSObjectType && !this.data.sObjectType.value) {
            this.data.sObjectType.value = this.selectedSObjectType;
        }

        if (this.selectedEventType && !this.data.event.value) {
            this.data.event.value = this.selectedEventType;
        }
    }

    handleSObjectTypeCheck() {
        sObjectTypeExists({objectName: this.data.sObjectType.value})
            .then(data => {
                this.handleValidityCheck('sObjectType', data);
            })
            .catch(error => this.showErrorToast(error));
    }

    handleApexClassCheck() {
        getApexClassDetails({apexClassName: this.data.apexClass.value, event: this.data.event.value})
            .then(data => {
                this.handleValidityCheck('apexClass', data.classExists && data.implementsInterface);
                this.classIsJsonEnabled = data.isJSONEnabled;
                this.setJSONWarning();
                if (!this.data.description.value) {
                    this.data.description.value = data.description;
                }
                this.checkMetadataExistsAlready(this.data.apexClass.value, this.data.event.value);
                this.fillLabelAndDeveloperName();
                return data;
            })
            .catch(error => this.showErrorToast(error));

    }

    setJSONWarning() {
        this.jsonEnabledWarningVisible = !this.classIsJsonEnabled && !!this.data.parameters.value;
    }

    checkMetadataExistsAlready(apexClassName, eventType) {
        this.metadataAlreadyExists = !!this.allMetadata.find(record => {
            return record.nebc__Apex_Class__c === apexClassName &&
                record.nebc__Event__c === eventType &&
                record.Id !== this.recordId;
        });
    }

    handleLabelCheck() {
        const value = this.data.label.value;
        let valid = false;
        if (value) {
            valid = this.startsWithLetter(value) && this.isThreeCharactersOrMore(value);
        }
        this.handleValidityCheck('label', valid);
    }

    handleDeveloperNameCheck() {
        const fieldName = 'developerName';
        const value = this.data.developerName.value;
        let valid = false;
        if (value) {
            valid = this.developerNameValidations(value);
        }
        if (valid) {
            developerNameExistsAlready({newName: value, metadataId: this.recordId})
                .then(exists => {
                    let valid = !exists;
                    this.handleValidityCheck(fieldName, valid);
                })
                .catch(error => this.showErrorToast(error));

        } else {
            this.handleValidityCheck(fieldName, valid);
        }
    }

    developerNameValidations(value) {
        return this.startsWithLetter(value) && this.isThreeCharactersOrMore(value) && !this.hasSpecialCharacters(value);
    }

    startsWithLetter(string) {
        return string.charAt(0).match(/[a-zA-Z]/i);
    }

    isThreeCharactersOrMore(string) {
        return string.length >= 3;
    }

    hasSpecialCharacters(string) {
        return string.match(/[^a-zA-Zd]/g)
    }

    handleValidityCheck(fieldName, data) {
        const field = this.template.querySelector(`.${fieldName}`);

        if (data) {
            this.data[fieldName].validated = true;
            this.data[fieldName].isInvalid = false;
            field.setCustomValidity('');
        } else {
            this.data[fieldName].isInvalid = true;
            field.setCustomValidity(this.data[fieldName].validityErrorMessage);
        }
        field.reportValidity();
    }

    handleEventCheck() {
        this.checkMetadataExistsAlready(this.data.apexClass.value, this.data.event.value);
        const valid = !!this.data.event.value;

        this.handleValidityCheck('event', valid);
        this.fillLabelAndDeveloperName();
        if (!!this.data.apexClass.value) {
            this.handleApexClassCheck();

        }
    }

    handleDescriptionCheck() {
        const valid = this.data.description.value ? this.data.description.value.length > 0 : false;
        this.handleValidityCheck('description', valid);
    }

    handleParametersCheck() {
        const isJSON = this.checkJSON(this.data.parameters.value);
        this.setJSONWarning();
        this.handleValidityCheck('parameters', isJSON);
    }

    handleOrderCheck() {
        const isAllNumbers = this.checkNumbers(this.data.order.value);
        this.handleValidityCheck('order', isAllNumbers);
    }

    checkNumbers(input) {
        return /^-?\d+$/.test(input);
    }

    handleActiveChange(event) {
        this.data.isActive.value = event.target.checked;
    }

    handleInputChange(event) {
        const dataType = event.target.name;
        this.data[dataType].value = event.detail.value;
        this.data[dataType].validated = false;
        this.data[dataType].isInvalid = false;
    }

    fillLabelAndDeveloperName() {
        const validApexClass = !!this.data.apexClass.value && this.data.apexClass.validated && !this.data.apexClass.isInvalid;

        if (validApexClass && this.data.event.value) {
            if (!this.data.label.value && !this.data.developerName.value) {
                const title = this.data.apexClass.value + this.getAbbreviation(this.data.event.value);
                this.data.label.value = title;
                this.data.label.validated = true;
                this.data.developerName.value = title.replace(/[^a-zA-Zd]/g, '_');
                this.data.developerName.validated = true;
            }
        }
    }

    checkJSON(string) {
        if (string && string.length > 0) {
            try {
                JSON.parse(string);
            } catch {
                return false
            }
        }
        return true;
    }

    getAbbreviation(event) {
        return this.eventOptions.find(record => record.value === event).abbreviation;
    }

    get eventOptions() {
        return [
            {label: 'All', value: ''},
            {label: 'Before Insert', value: 'BEFORE_INSERT', abbreviation: 'BI'},
            {label: 'After Insert', value: 'AFTER_INSERT', abbreviation: 'AI'},
            {label: 'Before Update', value: 'BEFORE_UPDATE', abbreviation: 'BU'},
            {label: 'After Update', value: 'AFTER_UPDATE', abbreviation: 'AU'},
            {label: 'Before Delete', value: 'BEFORE_DELETE', abbreviation: 'BD'},
            {label: 'After Delete', value: 'AFTER_DELETE', abbreviation: 'AD'},
            {label: 'After Undelete', value: 'AFTER_UNDELETE', abbreviation: 'AUD'},
        ]
    }

    closeModal() {
        this.dispatchEvent(new CustomEvent('closemodal'));
    }

    handleSubmit() {
        let allFieldsValid = true;
        let metadataRecord = this.isClone ? {} : {id: this.recordId};
        this.submitClicked = true;

        Promise.allSettled([
            getApexClassDetails({apexClassName: this.data.apexClass.value, event: this.data.event.value}),
            sObjectTypeExists({objectName: this.data.sObjectType.value}),
            developerNameExistsAlready({newName: this.data.developerName.value, metadataId: this.recordId})
        ]).then(data => {
            this.handleValidityCheck('apexClass', data[0].value.classExists && data[0].value.implementsInterface);
            this.handleValidityCheck('sObjectType', data[1].value);
            this.handleValidityCheck('developerName', !data[2].value && this.developerNameValidations(this.data.developerName.value));
            this.reRunAllOtherValidations();

            for (let key in this.data) {
                let currentField = this.data[key];
                metadataRecord[key] = this.data[key].value;
                if (!currentField.validated || currentField.isInvalid) {
                    allFieldsValid = false;
                }
            }

            if (allFieldsValid) {
                this.deployMetadata(metadataRecord);
            } else {
                this.submitClicked = false;
            }

        })
            .catch(error => this.showErrorToast(error));
    }


    reRunAllOtherValidations() {
        const excludedKeys = ['isActive', 'apexClass', 'sObjectType', 'developerName'];
        for (let key in this.data) {

            if (excludedKeys.includes(key)) {
                continue;
            }

            let currentField = this.data[key];

            if (!currentField.validated || currentField.isInvalid) {
                currentField.validatorFunction.bind(this)();
            }
        }
    }

    deployMetadata(record) {
        createNewMetadata({metadataObjects: [record]})
            .then(metadataRecord => {
                this.dispatchEvent(new CustomEvent('deploy', {detail: metadataRecord}));
                this.dispatchEvent(new CustomEvent('closemodal'));
            })
            .catch((error) => this.showErrorToast(error));
    }

    showErrorToast(error) {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: error.message,
            variant: 'error'
        });
        dispatchEvent(evt);
    }

}