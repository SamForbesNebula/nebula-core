/**
 * @author samuelf@nebulaconsulting.co.uk
 * @date 10/08/2022
 */

@IsTest
private class TriggerMetadataManagerModalControlTest {

    @IsTest
    static void sObjectExists() {

        Test.startTest();

        Boolean result = TriggerMetadataManagerModalController.sObjectTypeExists('Account');

        Test.stopTest();

        System.assertEquals(true, result);

    }

    @IsTest
    static void sObjectDoesntExist() {

        Test.startTest();

        Boolean result = TriggerMetadataManagerModalController.sObjectTypeExists('dfnsdjkafl');

        Test.stopTest();

        System.assertEquals(false, result);

    }

    @IsTest
    static void testRecordDoesntExist() {

        Test.startTest();

        Boolean result = TriggerMetadataManagerModalController.developerNameExistsAlready('testRecord', null);

        Test.stopTest();

        System.assertEquals(false, result);

    }

    @IsTest
    static void apexClassExists() {
        ApexClass newClass = new ApexClass(
                Name = 'TestClass',
                Body = '/**' +
                        '* @description a test description' +
                        '* with a line break' +
                        '*/' +
                        '@JSONAccess(Deserializable=\'Always\')' +
                        'global without sharing class TestClass implements nebc.BeforeUpdate {' +
                        'global void handleBeforeUpdate(List<SObject> input) {' +
                        '}' +
                        '}'
        );

        Test.startTest();

        TriggerMetadataManagerModalController.ApexClassDetails details = TriggerMetadataManagerModalController.createClassDetails(newClass, 'nebc.BeforeUpdate');

        Test.stopTest();

        System.assertEquals(true, details.classExists);
        System.assertEquals(true, details.isJSONEnabled);
        System.assertEquals(true, details.implementsInterface);
        System.assertEquals('a test description with a line break', details.description);
    }

    @IsTest
    static void apexClassNoDescriptionNoInterface() {
        ApexClass newClass = new ApexClass(
                Name = 'TestClass',
                Body = 'global without sharing class TestClass {' +
                        '}'
        );

        Test.startTest();

        TriggerMetadataManagerModalController.ApexClassDetails details = TriggerMetadataManagerModalController.createClassDetails(newClass, 'nebc.BeforeUpdate');

        Test.stopTest();

        System.assertEquals(true, details.classExists);
        System.assertEquals(false, details.isJSONEnabled);
        System.assertEquals(false, details.implementsInterface);
        System.assertEquals('', details.description);
    }

    @IsTest
    static void eventMapContainsValue(){

        Test.startTest();

        Map<String, String> eventMap  = TriggerMetadataManagerModalController.getEventMap();

        Test.stopTest();

        System.assertEquals('nebc.BeforeInsert', eventMap.get('BEFORE_INSERT'));

    }

    @IsTest
    static void eventMapNotContainsValue(){

        Test.startTest();

        Map<String, String> eventMap = TriggerMetadataManagerModalController.getEventMap();

        Test.stopTest();

        System.assertEquals(null, eventMap.get('BEFORE_UNDELETE'));

    }
}