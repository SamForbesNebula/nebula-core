/**
 * @author samuelf@nebulaconsulting.co.uk
 * @date 07/07/2022
 */

import {LightningElement, track} from 'lwc';
import getAllTriggerMetadata from '@salesforce/apex/TriggerMetadataManagerController.getAllTriggerMetadata';
import {ShowToastEvent} from "lightning/platformShowToastEvent";

export default class TriggerMetadataManager extends LightningElement {

    subscription;
    @track options = [];
    error;
    selectedObjectType;
    selectedEventType;
    allRecords;
    filteredRecords;
    @track newModalOpen = false;

    get hasOptions(){
        return this.options.length !== 0;
    }

    get eventOptions(){
        return [
            {label: 'All', value: ''},
            {label: 'Before Insert', value: 'BEFORE_INSERT'},
            {label: 'After Insert', value: 'AFTER_INSERT'},
            {label: 'Before Update', value: 'BEFORE_UPDATE'},
            {label: 'After Update', value: 'AFTER_UPDATE'},
            {label: 'Before Delete', value: 'BEFORE_DELETE'},
            {label: 'After Delete', value: 'AFTER_DELETE'},
            {label: 'After Undelete', value: 'AFTER_UNDELETE'},
        ]
    }

    handleSObjectSelection(event){
        this.selectedObjectType = event.detail.value;
        this.applyFilters();
        this.checkFilteredRecord();
    }

    handleEventTypeSelection(event){
        this.selectedEventType = event.detail.value;
        this.applyFilters();
        this.checkFilteredRecord();
    }

    applyFilters(){
        this.filterObjects(this.selectedObjectType);
        this.filterEvents(this.selectedEventType);
    }

    handleSelected(event){
        this.selectedRecordId = event.detail;
    }

    connectedCallback() {
        this.getMetadataRecords();
    }

    createOptions(data) {
        data.forEach(value => {
            let alreadyInOptions = this.options.findIndex(element => {
                return element.label === value.nebc__SObject__c;
            });

            if (alreadyInOptions === -1) {
                this.options.push({
                    label: value.nebc__SObject__c,
                    value: value.nebc__SObject__c
                });
            }
        });
        this.options.sort((a,b) => a.label.localeCompare(b.label));

        let alreadyInOptions = this.options.findIndex(element => {
            return element.label === 'All';
        });

        if (alreadyInOptions !== -1) {
            this.options.splice(alreadyInOptions, 1);
        }
        this.options.unshift({label: 'All', value: ''});

        this.options = JSON.parse(JSON.stringify(this.options));
    }

    handlePoll(){
        getAllTriggerMetadata()
            .then(data => {
                this.allRecords = data;
                this.createOptions(data);
                this.addReadableEventAndNamespace();
                this.filteredRecords = this.allRecords;
                this.applyFilters();

                this.template.querySelector('c-trigger-metadata-record-list')
                    .checkIfActionedRecordsUpdated();
            })
            .catch(error => {
                this.error = error;
                const evt = new ShowToastEvent({
                    title: 'Error',
                    message: this.error.message,
                    variant: 'error'
                });
                dispatchEvent(evt);
            });
    }

    getMetadataRecords(){
        getAllTriggerMetadata()
            .then(data => {
                this.allRecords = data;
                this.createOptions(data);
                this.addReadableEventAndNamespace();
                this.filteredRecords = this.allRecords;

            })
            .catch(error => {
                this.error = error;
            });
    }

    filterObjects(sObjectType) {
        if(sObjectType !== '' && !!sObjectType){
            this.filteredRecords = this.allRecords.filter(record => {
                return record.nebc__SObject__c === sObjectType;
            })
        } else {
            this.filteredRecords = this.allRecords;
        }
    }

    filterEvents(eventName) {
        if(eventName !== '' && !!eventName){
            this.filteredRecords = this.filteredRecords.filter(record => {
                return record.nebc__Event__c === eventName;
            })
        }
    }

    toggleModal(){
        this.newModalOpen = !this.newModalOpen;
    }

    checkFilteredRecord(){
        this.template.querySelector('c-trigger-metadata-record-list').checkFilteredRecord();
    }

    handleDeploy(event){
        this.template.querySelector('c-trigger-metadata-record-list')
            .handleDeployNew(event.detail);
    }

    addReadableEventAndNamespace(){
        this.allRecords.forEach(element => {
            element.isNebc = element.NamespacePrefix === 'nebc';
            element.eventReadable = this.eventOptions.find(el => {
                return el.value === element.nebc__Event__c;
            }).label;
        });
    }

}