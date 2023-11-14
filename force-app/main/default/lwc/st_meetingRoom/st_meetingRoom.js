import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getTime from '@salesforce/apex/ST_MeetingRoomController.getTime';
import getReserved from '@salesforce/apex/ST_MeetingRoomController.getReserved';
import doReserve from '@salesforce/apex/ST_MeetingRoomController.doReserve';
import getMyReserve from '@salesforce/apex/ST_MeetingRoomController.getMyReserve';
import deleteReserve from '@salesforce/apex/ST_MeetingRoomController.deleteReserve';
import getDeleteRecord from '@salesforce/apex/ST_MeetingRoomController.getDeleteRecord';

export default class St_meetingRoom extends LightningElement {

    @track dateList = [];
    @track roomList = ['TEST 1', 'TEST 2'];
    @track reserveList = [];
    @track myData = [];
    @track selectedData;
    @track allTimeData;
    @track delRecord = [];
    @track endTimeElList = [];
    clickedValue;
    delRecordId;
    isShowModal = false;
    isCancelReserveChkModal = false;

    connectedCallback() {
        const today = new Date(); // 현재 시각
        const tomorrow = new Date(new Date().setDate(today.getDate() + 1));
        const afterTomorrow = new Date(new Date().setDate(today.getDate() + 2));
        const week = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '월요일'];
        this.todayValue = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate() + ' ' + week[today.getDay()];
        this.tomorrowValue = tomorrow.getFullYear() + '/' + (tomorrow.getMonth() + 1) + '/' + (tomorrow.getDate()) + ' ' + week[tomorrow.getDay()];
        this.afterTomorrowValue = afterTomorrow.getFullYear() + '/' + (afterTomorrow.getMonth() + 1) + '/' + (afterTomorrow.getDate()) + ' ' + week[afterTomorrow.getDay()];

        this.dateList = [
            {label : this.todayValue, value : today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0')},
            {label : this.tomorrowValue, value : tomorrow.getFullYear() + '-' + (tomorrow.getMonth() + 1).toString().padStart(2, '0') + '-' + (tomorrow.getDate().toString().padStart(2, '0'))},
            {label : this.afterTomorrowValue, value : afterTomorrow.getFullYear() + '-' + (afterTomorrow.getMonth() + 1).toString().padStart(2, '0') + '-' + (afterTomorrow.getDate().toString().padStart(2, '0'))}
        ];
        console.log('dateList :: ',JSON.stringify(this.dateList));
        this.createList();
        this.getMyData();
    }

    /** 시간 클릭 버튼 */
    onTimeClick(e) {
        console.log('target :: ',e.target);
        console.log('idx :: ',e.target.dataset.index);

        const id = e.target.dataset.id;
        const idx = Number(e.target.dataset.index);
        const date = e.target.dataset.date;
        const room = e.target.dataset.room;
        // const startTime = e.target.dataset.startTime;
        // const endTime = e.target.dataset.endTime;
        const currentArray = {id : id, idx : idx, date : date, room : room};
        const idxArray = [];
        
        if(this.clickedValue) { // 두 번째 클릭일 시 첫 번째 클릭과 두 번째 클릭 사이 모두 체크해주기 위한 배열 생성 로직
            let small;
            let big;

            if(this.clickedValue.idx < idx) {
                small = this.clickedValue.idx;
                big = idx;
            } else {
                small = idx;
                big = this.clickedValue.idx;
            }

            for(let i = small; i <= big; i++) {
                idxArray.push(i);
            }
            console.log('idxArray :: ',JSON.stringify(idxArray));
        }
        
        this.reserveList.forEach(dt => {
            dt.room.forEach(r => {
                r.time.forEach(time => {

                    // 두 번째 클릭 체크
                    if(this.clickedValue) {

                        // 첫 번째 클릭과 두 번째 클릭이 같은 곳 클릭인지 체크
                        if(this.clickedValue.id != id) {

                            // 첫 번째 클릭과 두 번째 클릭이 다른 날짜나 회의실 클릭했는지 체크
                            if(this.clickedValue.room == room && this.clickedValue.date == date) {
                                
                                // 첫 번째 클릭부터 두 번째 클릭 사이 인덱스까지 체크
                                if(dt.value == date && r.value == room && idxArray.includes(time.index)) {
                                    let st;
                                    let et;
                                    if(!time.isReserved) {
                                        const startTime = this.template.querySelector('button[data-index="' + idxArray[0] + '"]').dataset.starttime;
                                        const endTime = this.template.querySelector('button[data-index="' + idxArray[idxArray.length-1] + '"]').dataset.endtime;
                                        this.selectedData = {date : dt.value, room : r.value, startTime : startTime, endTime : endTime};
                                        const allTimeData = [];
                                        for(let i = idxArray[0]; i <= idxArray[idxArray.length-1]; i++) {
                                            st = this.template.querySelector('button[data-index="' + i + '"]').dataset.starttime;
                                            et = this.template.querySelector('button[data-index="' + i + '"]').dataset.endtime;
                                            allTimeData.push({StartTime__c : st, EndTime__c : et});
                                        }
                                        this.allTimeData = allTimeData;
                                        time.isSelected = true;
                                        this.isShowModal = true;
                                    } else {
                                        this.isShowModal = false;
                                        this.iniData();
                                        return null;
                                    }
                                } else if(time.id == id) {
                                    time.isSelected = true;
                                    this.isShowModal = true;
                                }

                            } else {
                                if(time.id == id){
                                    time.isSelected = true;
                                    this.clickedValue = currentArray;
                                } else {
                                    this.iniData();
                                }
                            }
                        } else {
                            if(time.isSelected == true) {
                                this.iniData();
                            }
                        }
                        
                    } else { // 첫 번째 클릭
                        if(time.id == id) {
                            if(time.isSelected == true) {
                                this.iniData();
                            } else {
                                time.isSelected = true;
                                this.clickedValue = currentArray
                            }
                        }
                    }
                });
            });
        });
    }

    /** 모달 창 예약 버튼 */
    onReserveClick() {
        doReserve({selectedData : this.selectedData, allTimeData : JSON.stringify(this.allTimeData)})
        .then(res => {
            console.log('res :: ',res);
            if(res == 'S') {
                this.isShowModal = false;
                this.createList();
                this.getMyData();
                this.dispatchEvent(
                    new ShowToastEvent({title: '', message: '예약 성공 ~~ !!', variant: 'success' })
                );
            } else if(res == 'D') {
                this.dispatchEvent(
                    new ShowToastEvent({title: '', message: '이미 예약된 시간입니다 ,,', variant: 'warning' })
                );
            } else {
                this.dispatchEvent(
                    new ShowToastEvent({title: '', message: '예약에 실패하였습니다 ,, 다시 시도해주세요 ,,', variant: 'warning' })
                );
            }
        }).catch(err => {
            console.log('err :: ',err);
        });
    }

    /** 모달 창 닫기 버튼 */
    onCloseModalClick() {
        console.log('1');
        this.isShowModal = false;
        console.log('2');
        this.isCancelReserveChkModal = false;
        console.log('3');
        this.iniData();
    }

    /** 3차원 예약 배열 만드는 함수 */
    createList() {
        this.reserveList = [];
        this.clickedValue = null;
        getTime().then(res => {
            console.log('res :: ',res);
            const startTime = res.startTimeList;
            const endTime = res.endTimeList;
            this.dateList.forEach(date => {
                const roomList = [];
                this.roomList.forEach(room => {
                    const timeList = [];
                    for(let i = 0; i < startTime.length; i++) {
                        const id = date.value + room + startTime[i] + endTime[i];
                        timeList.push({id : id, index : i, startTime : startTime[i], endTime : endTime[i], isSelected : false, isReserved : false, isColor : false});
                    }
                    roomList.push({value : room, time : timeList});
                });
                this.reserveList.push({label : date.label, value : date.value, room : roomList});
            });
            this.getReservedData();
        }).catch(err => {
            console.log('err :: ',err);
        });
    }

    /** 예약된 데이터 가져오는 함수 */
    getReservedData() {
        getReserved().then(result => {
            console.log('result :: ',result);
            const reservedData = [];
            result.forEach(el => {
                const startIdx = this.template.querySelector('button[data-starttime="' + el.StartTime__c + '"]').dataset.index;
                const endIdx = this.template.querySelector('button[data-endtime="' + el.EndTime__c + '"]').dataset.index;
                reservedData.push({date : el.MeetingDate__c, room : el.RoomName__c, startIdx : startIdx, endIdx : endIdx, endTime : el.EndTime__c});
            });
            console.log('reservedData :: ',JSON.stringify(reservedData));
            const color = ['red', 'orange', 'yellow', 'green', 'blue', 'navy', 'purple'];
            let colorIdx;
            this.endTimeElList = [];
            for(let i = 0; i < reservedData.length; i++) {
                let endTimeEl;
                this.reserveList.forEach(date => {
                    date.room.forEach(room => {
                        room.time.forEach(time => {
                            if(reservedData[i].date == date.value && reservedData[i].room == room.value) {
                                const small = Number(reservedData[i].startIdx);
                                const big = Number(reservedData[i].endIdx);
                                for(let x = small; x <= big; x++) {
                                    if(time.index == x) {
                                        time.isReserved = true;
                                        endTimeEl = this.template.querySelector('button[data-id="' + time.id + '"]');
                                        endTimeEl = time.id;
                                    }
                                }
                                if(i > 6) {
                                    if(i % 7 == 0) {
                                        colorIdx = 0;
                                    }
                                } else {
                                    colorIdx = i;
                                }
                                this.changeColor(color[colorIdx]);
                            }
                        });
                    });
                });
                this.endTimeElList.push(endTimeEl);
                colorIdx++;
            }
        }).catch(err => {
            console.log('err :: ',err);
        });
    }

    /** 예약된 데이터 마지막 인덱스 요소의 오른쪽 border 생성 */
    renderedCallback() {
        this.endTimeElList.forEach(el => {
            let endTimeEl = this.template.querySelector('button[data-id="' + el + '"]');
            endTimeEl.style.borderRight = 'solid 1px lightgray';
            console.log('endTimeEl :: ',endTimeEl);
        });
    }

    /** 예약된 데이터 색깔 바꾸는 함수 */
    changeColor(color) {
        this.reserveList.forEach(date => {
            date.room.forEach(room => {
                room.time.forEach(time => {
                    if(time.isReserved) {
                        if(!time.isColor) {
                            time.color = color;
                            time.isColor = true;
                        }
                    }
                });
            });
        });
    }

    /** 선택한 예약 버튼 초기화 함수 */
    iniData() {
        this.reserveList.forEach(date => {
            date.room.forEach(room => {
                room.time.forEach(time => {
                    time.isSelected = false;
                });
            });
        });
        this.clickedValue = null;
    }

    /** 나의 예약 정보 가져오는 함수 */
    getMyData() {
        getMyReserve().then(res => {
            console.log('my res :: ',res);
            if(res.length > 0) this.myData = res;
            else this.myData = null;
        }).catch(err => {
            cosnoel.log('err :: ',err);
        });
    }

    /** 내 예약에서 라디오 버튼 함수 */
    onRadioChange(e) {
        console.log('value :: ',e.target.value);
        this.delRecordId = e.target.value;
    }

    /** 예약 취소 모달 창 띄우는 버튼 */
    onCancelReserved() {
        if(!this.delRecordId) {
            this.dispatchEvent(
                new ShowToastEvent({title: '', message: '취소할 예약내역을 선택해주세요 ,,', variant: 'warning' })
            );
        } else {
            this.isCancelReserveChkModal = true;
            getDeleteRecord({delRecordId : this.delRecordId}).then(res => {
                console.log('res :: ',res);
                this.delRecord = res;
            }).catch(err => {
                console.log('err :: ',err);
            });
        }
    }

    /** 모달 창에서 예약 취소 버튼 */
    onDeleteReserve() {
        deleteReserve({delRecordId : this.delRecordId}).then(res => {
            console.log('res :: ',res);
            if(res == 'S') {
                this.dispatchEvent(
                    new ShowToastEvent({title: '', message: '예약을 취소하였습니다 !', variant: 'success' })
                );
                this.delRecordId = null;
                this.delRecord = [];
                this.getMyData();
                this.createList();
            } else {
                this.dispatchEvent(
                    new ShowToastEvent({title: '', message: '예약 취소에 실패하였습니다 ,,', variant: 'warning' })
                );
            }
            this.isCancelReserveChkModal = false;
        }).catch(err => {
            console.log('err :: ',err);
        });
    }

}