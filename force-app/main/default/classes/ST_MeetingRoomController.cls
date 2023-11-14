public with sharing class ST_MeetingRoomController {

    // 모든 시간 가져오는 메서드
    @AuraEnabled
    public static Map<String,List<String>> getTime() {
        List<MeetingTime__c> mtList = [SELECT Id, StartTime__c, EndTime__c FROM MeetingTime__c];
        List<String> startTimeList = new List<String>();
        List<String> endTimeList = new List<String>();
        for(MeetingTime__c mt : mtList) {
            Integer startHours = mt.StartTime__c.hour();
            Integer startMinutes = mt.StartTime__c.minute();
            Integer endHours = mt.EndTime__c.hour();
            Integer endMinutes = mt.EndTime__c.minute();
            startTimeList.add(String.valueOf(startHours).leftPad(2, '0') + ':' + String.valueOf(startMinutes).leftPad(2, '0'));
            endTimeList.add(String.valueOf(endHours).leftPad(2, '0') + ':' + String.valueOf(endMinutes).leftPad(2, '0'));
        }
        Map<String,List<String>> returnMap = new Map<String,List<String>>();
        returnMap.put('startTimeList', startTimeList);
        returnMap.put('endTimeList', endTimeList);
        return returnMap;
    }

    // 예약된 회의실 리스트 가져오는 메서드
    @AuraEnabled
    public static List<ReserveMeetingRoom__c> getReserved(){
        try {

            List<ReserveMeetingRoom__c> rmList = new List<ReserveMeetingRoom__c>();
            rmList = [SELECT Id, MeetingDate__c, RoomName__c, StartTime__c, EndTime__c FROM ReserveMeetingRoom__c WHERE MeetingDate__c >= TODAY ORDER BY CreatedDate];

            return rmList;
        } catch (Exception e) {
            System.debug('err :: ' + e.getMessage() + ' || ' + e.getLineNumber());
            return null;
        }
    }

    // 회의실 예약 메서드
    @AuraEnabled
    public static String doReserve(Map<String,String> selectedData, String allTimeData){
        String returnValue;
        try {
            ReserveMeetingRoom__c rm = new ReserveMeetingRoom__c();
            rm.MeetingDate__c = Date.valueOf(selectedData.get('date'));
            rm.RoomName__c = selectedData.get('room');
            rm.StartTime__c = selectedData.get('startTime');
            rm.EndTime__c = selectedData.get('endTime');

            List<ReserveMeetingTime__c> rmtList = (List<ReserveMeetingTime__c>) JSON.deserialize(allTimeData, List<ReserveMeetingTime__c>.class);
            List<String> startTimeList = new List<String>();
            List<String> endTimeList = new List<String>();
            for(ReserveMeetingTime__c rmt : rmtList) {
                startTimeList.add(rmt.StartTime__c);
                endTimeList.add(rmt.EndTime__c);
            }

            List<ReserveMeetingTime__c> chkList = [
                SELECT Id
                FROM ReserveMeetingTime__c
                WHERE (ReserveMeetingRoom__r.MeetingDate__c =: rm.MeetingDate__c AND ReserveMeetingRoom__r.RoomName__c =: rm.RoomName__c)
                AND (StartTime__c IN : startTimeList OR EndTime__c IN : endTimeList)
            ];

            if(chkList.isEmpty()) {
                insert rm;

                List<ReserveMeetingTime__c> insertRmtList = new List<ReserveMeetingTime__c>();
                for(ReserveMeetingTime__c rmt : rmtList) {
                    ReserveMeetingTime__c newRmt = new ReserveMeetingTime__c();
                    newRmt.ReserveMeetingRoom__c = rm.Id;
                    newRmt.StartTime__c = rmt.StartTime__c;
                    newRmt.EndTime__c = rmt.EndTime__c;
                    insertRmtList.add(newRmt);
                }
                insert insertRmtList;
                returnValue = 'S';
            } else {
                returnValue = 'D';
            }
            System.debug('rmtList :: ' + rmtList);

        } catch (Exception e) {
            System.debug('err :: ' + e.getMessage() + ' || ' + e.getLineNumber());
            returnValue = 'F';
        }
        return returnValue;
    }

    // 나의 예약 정보 가져오는 메서드
    @AuraEnabled
    public static List<ReserveMeetingRoom__c> getMyReserve(){
        try {
            String userId = System.UserInfo.getUserId();
            List<ReserveMeetingRoom__c> rmList = [
                SELECT Id, MeetingDate__c, RoomName__c, StartTime__c, EndTime__c
                FROM ReserveMeetingRoom__c
                WHERE CreatedById =: userId
                AND MeetingDate__c >= TODAY
                ORDER BY MeetingDate__c, StartTime__c, CreatedDate ASC
            ];
            return rmList;
        } catch (Exception e) {
            System.debug('err :: ' + e.getMessage() + ' || ' + e.getLineNumber());
            return null;
        }
    }

    // 예약 내역 지우는 메서드
    @AuraEnabled
    public static String deleteReserve(String delRecordId){
        try {
            List<ReserveMeetingRoom__c> rmList = [SELECT Id FROM ReserveMeetingRoom__c WHERE Id =: delRecordId];
            if(!rmList.isEmpty()) delete rmList;
            return 'S';
        } catch (Exception e) {
            System.debug('err :: ' + e.getMessage() + ' || ' + e.getLineNumber());
            return 'F';
        }
    }

    @AuraEnabled
    public static ReserveMeetingRoom__c getDeleteRecord(String delRecordId){
        try {
            ReserveMeetingRoom__c rm = [SELECT Id, MeetingDate__c, RoomName__c, StartTime__c, EndTime__c FROM ReserveMeetingRoom__c WHERE Id =: delRecordId LIMIT 1];
            return rm;
        } catch (Exception e) {
            System.debug('err :: ' + e.getMessage() + ' || ' + e.getLineNumber());
            return null;
        }
    }
}