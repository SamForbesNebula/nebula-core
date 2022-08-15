/**
 * @author samuelf@nebulaconsulting.co.uk
 * @date 08/07/2022
 */

import {LightningElement, api} from 'lwc';

export default class TriggerMetadataSelectedRecord extends LightningElement {

    @api selectedRecord;

    get recordSelected() {
        return !!this.selectedRecord;
    }

}