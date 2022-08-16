/**
 * @author samuelf@nebulaconsulting.co.uk
 * @date 07/07/2022
 * @description controller for LWC TriggerMetadataManager
 */

@SuppressWarnings('PMD.ExcessivePublicCount')
public without sharing class TriggerMetadataManagerController {

    @TestVisible
    private class Input {
        @AuraEnabled public Id id {get; set;}
        @AuraEnabled public Boolean isActive {get; set;}
        @AuraEnabled public Integer order {get; set;}
        @AuraEnabled public String label {get; set;}
        @AuraEnabled public String developerName {get; set;}
        @AuraEnabled public String description {get; set;}
        @AuraEnabled public String sObjectType {get; set;}
        @AuraEnabled public String apexClass {get; set;}
        @AuraEnabled public String parameters {get; set;}
        @AuraEnabled public String event {get; set;}
    }

    @AuraEnabled
    public static List<nebc__Trigger_Handler__mdt> getAllTriggerMetadata(){
        return [
                SELECT Id, MasterLabel, DeveloperName, nebc__Active__c, nebc__Description__c, nebc__Event__c,
                nebc__Apex_Class__c, nebc__SObject__c, nebc__Order__c, nebc__Parameters__c, NamespacePrefix
                FROM nebc__Trigger_Handler__mdt
                ORDER BY nebc__SObject__c ASC, nebc__Event__c ASC, nebc__Order__c ASC
        ];
    }

    @AuraEnabled
    public static nebc__Trigger_Handler__mdt createNewMetadata(List<Input> metadataObjects){

        List<nebc__Trigger_Handler__mdt> metadataRecords = new nebc.LazyIterator(metadataObjects)
            .mapValues(new CreateTriggerMetadata())
            .toList(new List<nebc__Trigger_Handler__mdt>());

        Metadata.DeployContainer container = new Metadata.DeployContainer();

        new nebc.LazySObjectIterator(metadataRecords)
                .mapValues(new DeployableMetadataFromSObject())
                .forEach(new AddMetadataToContainer(container));

        if(!Test.isRunningTest()){
            Metadata.Operations.enqueueDeployment(container, null);
        }

        return metadataRecords[0];

    }

    private inherited sharing class CreateTriggerMetadata implements nebc.Function {

        public nebc__Trigger_Handler__mdt call(Object o) {

            Input input = (Input) o;
            return new nebc__Trigger_Handler__mdt(
                    Id = input.id,
                    nebc__Active__c = input.isActive,
                    nebc__Order__c = input.order,
                    MasterLabel = input.label,
                    DeveloperName = input.developerName,
                    nebc__Description__c = input.description,
                    nebc__SObject__c = input.sObjectType,
                    nebc__Apex_Class__c = input.apexClass,
                    nebc__Parameters__c = input.parameters,
                    nebc__Event__c = input.event
            );
        }
    }

    private inherited sharing class AddMetadataToContainer implements nebc.VoidFunction{

        private Metadata.DeployContainer container;

        public AddMetadataToContainer(Metadata.DeployContainer container){
            this.container = container;

        }

        public void call(Object o) {
            Metadata.Metadata metadataRecord = (Metadata.Metadata) o;
            this.container.addMetadata(metadataRecord);
        }
    }

}