/**
 * @author samuelf@nebulaconsulting.co.uk
 * @date 14/07/2022
 * @description controller class for the LWC TriggerMetadataManagerNewModal
 */

public with sharing class TriggerMetadataManagerModalController {

    @AuraEnabled
    public static Boolean sObjectTypeExists(String objectName) {

        try {
            Type.forName(objectName).newInstance();
            return true;
        } catch (NullPointerException e) {
            return false;
        }
    }

    public class ApexClassDetails {
        @AuraEnabled public Boolean classExists;
        @AuraEnabled public Boolean implementsInterface;
        @AuraEnabled public String description;
        @AuraEnabled public Boolean isJSONEnabled;
    }

    @AuraEnabled
    public static ApexClassDetails getApexClassDetails(String apexClassName, String event) {

        Map<String, String> eventMap = getEventMap();
        String namespace;

        if (apexClassName.contains('.')) {
            List<String> splitName = apexClassName.split('\\.');
            namespace = splitName[0];
            apexClassName = splitName[1];
        }

        ApexClass classRecord;
        try {
            classRecord = [
                    SELECT Id, Body, NamespacePrefix
                    FROM ApexClass
                    WHERE Name = :apexClassName
                    AND NamespacePrefix = :namespace
                    LIMIT 1
            ];
            return createClassDetails(classRecord, event == null ? null : eventMap.get(event));
        } catch (QueryException e) {
            return createClassDetails(classRecord, event == null ? null : eventMap.get(event));
        }

    }

    @TestVisible
    private static ApexClassDetails createClassDetails(ApexClass classRecord, String nebcInterface) {
        ApexClassDetails details = new ApexClassDetails();

        details.classExists = classRecord != null;
        if (details.classExists) {
            details.implementsInterface = nebcInterface == null ? false : containsNebulaInterface(classRecord, nebcInterface);
            details.isJSONEnabled = isJSONEnabled(classRecord);

            if (classRecord.Body.contains('@description ') && details.implementsInterface && details.classExists) {
                details.description = getDescription(classRecord);
            } else {
                details.description = '';
            }
        }
        return details;
    }

    private static String getDescription(ApexClass classRecord) {
        return classRecord.NamespacePrefix == 'nebc' ? '' : classRecord.Body.substringBetween('@description ', '/')
                .replaceAll('\\*','').replaceAll('\n','').replaceAll('/','');
    }

    private static Boolean containsNebulaInterface(ApexClass classRecord, String interfaceKey) {
        String coreInterfaceKey = interfaceKey.substringAfter('.');
        return classRecord.Body.contains(interfaceKey) || classRecord.Body.contains(coreInterfaceKey);
    }

    private static Boolean isJSONEnabled(ApexClass classRecord) {
        return classRecord.Body.contains('@JsonAccess(Deserializable=\'always\')');
    }

    @TestVisible
    private static Map<String, String> getEventMap() {
        return new Map<String, String>{
                'BEFORE_INSERT' => 'nebc.BeforeInsert',
                'BEFORE_UPDATE' => 'nebc.BeforeUpdate',
                'BEFORE_DELETE' => 'nebc.BeforeDelete',
                'AFTER_INSERT' => 'nebc.AfterInsert',
                'AFTER_UPDATE' => 'nebc.AfterUpdate',
                'AFTER_DELETE' => 'nebc.AfterDelete',
                'AFTER_UNDELETE' => 'nebc.AfterUndelete'
        };
    }

    @AuraEnabled
    public static Boolean developerNameExistsAlready(String newName, Id metadataId) {
        return [
                SELECT DeveloperName
                FROM nebc__Trigger_Handler__mdt
                WHERE DeveloperName = :newName
                AND Id != :metadataId
        ].size() > 0;
    }

}