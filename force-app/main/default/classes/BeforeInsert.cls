/**
 * @author aidan@nebulaconsulting.co.uk
 * @date 2019-03-01
 */

public interface BeforeInsert {

    void handleBeforeInsert(List<SObject> newList);
}