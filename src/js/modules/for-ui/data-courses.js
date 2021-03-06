let dataCourses = {}
for (let courseId in dataCourses) {
  dataCourses[courseId].action = () => {}
}

dataCourses = Object.assign(dataCourses, {
  1: {
    date: '2019年7月1日',
    time: '14:00-15:00',
    userPlan: '國一上數學',
    unit: '通貫古今--鄭伯克段于鄢',
    tool: '天元突破',
    eTutorUrl: 'https://www.tbbt.com.tw/index.html',
    eTutorBtnClass: 'class-btn-ready',
    classBtnCss: 'class-btn-start',
    classBtnImg: './img/btn-start.png'
  },
  2: {
    date: '2019年7月1日',
    time: '14:00-15:00',
    userPlan: '國一上數學',
    unit: '通貫古今--鄭伯克段于鄢',
    tool: '天元突破',
    eTutorUrl: 'https://www.tbbt.com.tw/index.html',
    eTutorBtnClass: 'class-btn-not-ready',
    classBtnCss: 'class-btn-ready',
    classBtnImg: './img/btn-ready.png'
  },
  3: {
    date: '2019年7月1日',
    time: '14:00-15:00',
    userPlan: '國一上數學',
    unit: '通貫古今--鄭伯克段于鄢',
    tool: '天元突破',
    eTutorUrl: '',
    eTutorBtnClass:'class-btn-not-ready',
    classBtnCss: 'class-btn-noclass',
    classBtnImg: './img/btn-noclass.png'
  },
  4: {
    date: '2019年7月1日',
    time: '14:00-15:00',
    userPlan: '國一上數學',
    unit: '通貫古今--鄭伯克段于鄢',
    tool: '天元突破',
    eTutorUrl: 'https://www.tbbt.com.tw/index.html',
    eTutorBtnClass: 'class-btn-not-ready',
    classBtnCss: 'class-btn-done',
    classBtnImg: './img/btn-done.png'
  },
  5: {
    date: '2019年7月1日',
    time: '14:00-15:00',
    userPlan: '國一上數學',
    unit: '通貫古今--鄭伯克段于鄢',
    tool: '天元突破',
    eTutorUrl: '',
    eTutorBtnClass: 'class-btn-not-ready',
    classBtnCss: 'class-btn-check',
    classBtnImg: './img/btn-check.png'
  },
  6: {
    date: '2019年7月1日',
    time: '14:00-15:00',
    userPlan: '國一上數學',
    unit: '通貫古今--鄭伯克段于鄢',
    tool: '天元突破',
    eTutorUrl: 'https://www.tbbt.com.tw/index.html',
    eTutorBtnClass: 'class-btn-ready',
    classBtnCss: 'class-btn-add',
    classBtnImg: './img/btn-add.png'
  },
  7: {
    date: '2019年7月1日',
    time: '14:00-15:00',
    userPlan: '國一上數學',
    unit: '通貫古今--鄭伯克段于鄢',
    tool: '天元突破',
    eTutorUrl: '',
    eTutorBtnClass: 'class-btn-not-ready',
    classBtnCss: 'class-btn-check-error',
    classBtnImg: './img/btn-check-error.png'
  }
})

export default dataCourses