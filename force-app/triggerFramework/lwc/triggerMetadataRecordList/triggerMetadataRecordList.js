/**
 * @author samuelf@nebulaconsulting.co.uk
 * @date 07/07/2022
 */

import {LightningElement, api, track} from 'lwc';
import logo from '@salesforce/resourceUrl/NebulaLogoNoText';
import {NavigationMixin} from "lightning/navigation";

const columns = [

    {label: 'sObject', fieldName: 'nebc__SObject__c', type: 'text'},
    {label: 'Event', fieldName: 'nebc__Event__c', type: 'text'},
    {label: 'Order', fieldName: 'nebc__Order__c', type: 'number'},
    {label: 'Apex Class', fieldName: 'nebc__Apex_Class__c', type: 'text'},
    {label: 'Status', fieldName: 'nebc__Active__c', type: 'text'},

];

const intervalTime = 10000;

export default class TriggerMetadataRecordList extends NavigationMixin(LightningElement) {

    @api filteredRecords;
    @api allMetadata;
    selectedRecordId;
    @track selectedRecord;
    selectedRecordLocked = false;
    selectedElement;
    editModalOpen = false;
    columns = columns;
    @track metadataDeploying = [];
    isClone;
    intervalId;
    deploymentStatusURL;
    logo = logo;

    get recordSelected() {
        return !!this.selectedRecordId;
    }

    get hasDeployments() {
        return this.metadataDeploying.length > 0;
    }

    handleNavigate(event) {
        event.stopPropagation();
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.selectedRecordId,
                actionName: 'view'
            }
        }).then(url => window.open(url, "_blank"));
    }

    connectedCallback() {
        this.deploymentStatusURL = window.location.origin + '/lightning/setup/DeployStatus/home';
    }

    handleRowEditClicked() {
        if (!this.selectedRecord.isNebc) {
            this.toggleEditModal();
        }
    }

    handleRowCloneClicked() {
        if (!this.selectedRecord.isNebc) {
            this.toggleCloneModal();
        }
    }

    handleRowSelection(event) {
        this.selectedRecordId = event.currentTarget.dataset.id;
        let index = this.filteredRecords.findIndex(record => {
            return record.Id === this.selectedRecordId;
        });

        if (index !== -1) {
            this.selectedRecord = this.filteredRecords[index];
            this.selectedRecordLocked = this.selectedRecord.isNebc;
        }

        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }

        this.template.querySelectorAll('tr').forEach(element => {

            if (element.dataset.id === this.selectedRecordId) {
                this.selectedElement = element;
            }
        });

        this.selectedElement.classList.add('selected');
    }

    @api checkFilteredRecord() {
        if (this.selectedRecordId) {
            const filteredContainsRecord = this.filteredRecords.find(record => {
                record.Id === this.selectedRecordId;
            });
            if (!filteredContainsRecord) {
                this.selectedRecordId = undefined;
                this.selectedRecord = undefined;
            }
        }
    }

    toggleEditModal() {
        this.isClone = false;
        this.editModalOpen = !this.editModalOpen;
    }

    toggleCloneModal() {
        this.isClone = true;
        this.editModalOpen = !this.editModalOpen;
    }

    startPolling() {
        this.intervalId = setInterval(() => {
            this.dispatchEvent(new CustomEvent('queryrecords'));
        }, intervalTime);
    }


    @api checkIfActionedRecordsUpdated() {
        this.metadataDeploying.forEach((metadata, forEachIndex) => {
            let index = this.allMetadata.findIndex(el => {
                return el.nebc__Event__c === metadata.nebc__Event__c &&
                    el.nebc__Parameters__c === metadata.nebc__Parameters__c &&
                    el.nebc__Apex_Class__c === metadata.nebc__Apex_Class__c &&
                    el.nebc__Order__c === metadata.nebc__Order__c &&
                    el.nebc__Active__c === metadata.nebc__Active__c &&
                    el.nebc__SObject__c === metadata.nebc__SObject__c &&
                    el.nebc__Description__c.trim() === metadata.nebc__Description__c.trim() &&
                    el.MasterLabel === metadata.MasterLabel &&
                    el.DeveloperName === metadata.DeveloperName;

            });

            if (index !== -1) {
                this.metadataDeploying.splice(forEachIndex, 1);
            }
        });

        if (this.metadataDeploying.length === 0) {
            this.stopPolling();
        }
    }

    stopPolling() {
        clearInterval(this.intervalId);
    }

    handleDeploy(event) {
        this.metadataDeploying.push(event.detail);
        this.startPolling();
    }

    @api handleDeployNew(record) {
        this.metadataDeploying.push(record);
        this.startPolling();
    }

}