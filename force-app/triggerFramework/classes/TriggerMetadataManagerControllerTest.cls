/**
 * @author samuelf@nebulaconsulting.co.uk
 * @date 10/08/2022
 */

@IsTest
private class TriggerMetadataManagerControllerTest {

    @IsTest
    static void metadataCreation() {
        TriggerMetadataManagerController.Input input = new TriggerMetadataManagerController.Input();
        input.isActive = true;
        input.order = 0;
        input.label = 'test record';
        input.developerName = 'test_record';
        input.description = 'a description';
        input.sObjectType = 'Account';
        input.apexClass = 'AccountTest';
        input.event = 'BEFORE_INSERT';

        Test.startTest();

        nebc__Trigger_Handler__mdt metadata = TriggerMetadataManagerController.createNewMetadata(new List<TriggerMetadataManagerController.Input>{
                input
        });

        Test.stopTest();

        System.assert(metadata.nebc__Active__c == input.isActive);
        System.assert(metadata.nebc__Order__c == input.order);
        System.assert(metadata.MasterLabel == input.label);
        System.assert(metadata.DeveloperName == input.developerName);
        System.assert(metadata.nebc__Description__c == input.description);
        System.assert(metadata.nebc__SObject__c == input.sObjectType);
        System.assert(metadata.nebc__Apex_Class__c == input.apexClass);
        System.assert(metadata.nebc__Parameters__c == input.parameters);
        System.assert(metadata.nebc__Event__c == input.event);

    }

    @IsTest
    static void queryMetadata() {

        Test.startTest();

        List<nebc__Trigger_Handler__mdt> metadataList = TriggerMetadataManagerController.getAllTriggerMetadata();

        Test.stopTest();

        System.assertNotEquals(null, metadataList);

    }
}