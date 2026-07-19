export interface LinkButton {
  label: string
  url: string
}

export interface LinkCard {
  id: string
  title: string
  tag: string
  description: string
  buttons: LinkButton[]
}

export const LINK_CARDS: LinkCard[] = [
  {
    id: 'freshman',
    title: '輔大新生專區',
    tag: '必看',
    description:
      '包含入學流程圖指南、各項證明文件繳交清單與校園生活常見問題 (Q&A)。開學前先看這裡就對了。',
    buttons: [{ label: '前往新生專區', url: 'https://fjcuadm.fju.edu.tw/speed.php?id=2' }],
  },
  {
    id: 'portal',
    title: '學生資訊入口網 (Portal)',
    tag: '常用',
    description:
      '輔大最核心的入口。注意左側選單（選課系統、全人課程志願、課程大綱）、中間區塊（學雜費繳費單下載）以及右側區塊（活動管理系統）。',
    buttons: [{ label: '前往 Portal', url: 'https://portal.fju.edu.tw/student/' }],
  },
  {
    id: 'myfju',
    title: '學生資訊平台 (MyFJU)',
    tag: '成績 / 資安',
    description:
      '管理個人數位足跡。新生必做的基本資料與照片上傳（會影響學生證領取），以及學期末的成績查詢都在這裡。',
    buttons: [{ label: '前往 MyFJU', url: 'https://sis.fju.edu.tw/#/' }],
  },
  {
    id: 'schedule',
    title: '選課時程與學校行事曆',
    tag: '時程重要',
    description:
      '掌握選課規則與重要日期。按鈕 A 查詢選課辦法與衝堂規則；按鈕 B 查看放假與重要大日程。',
    buttons: [
      { label: '選課資訊網', url: 'https://course.fju.edu.tw/' },
      { label: '學校行事曆', url: 'http://www.secretariat.fju.edu.tw/article.jsp?articleID=8' },
    ],
  },
  {
    id: 'daily',
    title: '日常上課系統',
    tag: '日常上課',
    description:
      '每天都會用到的兩大系統。按鈕 A 收取校務通知與選課確認信；按鈕 B 查看上課簡報、分組討論與繳交課堂作業。',
    buttons: [
      { label: '學校 Email', url: 'https://outlook.cloud.microsoft/mail/' },
      { label: 'TronClass', url: 'https://elearn2.fju.edu.tw/#/' },
    ],
  },
  {
    id: 'oj',
    title: '程式設計作業平台 (OJ)',
    tag: '資安 / AI 專屬',
    description:
      '資安與 AI 科系必備的程式評測系統（Online Judge），用於提交程式作業並即時查看評測分數。',
    buttons: [{ label: '前往 Online Judge', url: 'https://oj.cyhsieh.com/' }],
  },
  {
    id: 'classin',
    title: '學長姐選課評論平台',
    tag: '過往參考',
    description:
      '由學長姐自發維護的通識與各系選課評價。近年資料較舊，但仍可作為選課甜涼度的過往參考。',
    buttons: [{ label: '前往選課評論', url: 'https://classin.info/' }],
  },
]
