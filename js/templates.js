const initialStatusList=[
    {id:"status_1",name:"우선탑승 (Pre-boarding)"},
    {id:"status_2",name:"탑승중 (Boarding)"},
    {id:"status_3",name:"탑승마감 (Final Call)"}
];
const initialLangList=[
    {id:"lang_1",name:"종합 방송"},
    {id:"lang_2",name:"한국어 전용"},
    {id:"lang_3",name:"영어 전용"}
];
const defaultTemplates={
    "status_1_lang_1":`더 멋진 변화의 시작, 티웨이항공에서 안내 말씀드리겠습니다. 잠시 후 티웨이항공 [편명] 편 [목적지]행 항공기의 탑승이 시작될 예정입니다. 원활하고 신속한 탑승을 위하여 몸이 불편하신 손님 및 유아를 동반하신 손님, 플래티넘 손님께서 먼저 탑승을 준비하여 주시기 바랍니다. 감사합니다.\n\nYour attention please. T'way Air flight (편명) bound for (목적지) is now ready for boarding. For efficient boarding, we will invite passengers who need special assistance, or are traveling with infants, business saver, t'way plus Platinum to board first. Thank you.\n\nT'way 航空よりご案内申し上げます。まもなくT'way 航空（편명）便（목적지）行きのご搭乗を開始させて頂きます。まず始めに、体の具合が悪いお客様およびお子様連れのお客様より機内へのご案内をさせて頂きますので、搭乗券をお持ちになって、搭乗口前にお越しください。`
};
const translationDic={
    "오사카":{en:"Osaka",ja:"大阪",zh:"大阪"},
    "후쿠오카":{en:"Fukuoka",ja:"福岡",zh:"福冈"},
    "나리타":{en:"Narita",ja:"成田",zh:"成田"},
    "삿포로":{en:"Sapporo",ja:"札幌",zh:"扎幌"},
    "나트랑":{en:"Nha Trang",ja:"ニャチャン",zh:"芽庄"},
    "홍콩":{en:"Hong Kong",ja:"香港",zh:"香港"},
    "가오슝":{en:"Kaohsiung",ja:"高雄",zh:"高雄"}
};
