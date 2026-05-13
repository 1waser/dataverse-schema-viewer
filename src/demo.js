// demo.js — サンプルDataverseスキーマデータ

const DEMO_TABLES = [
  { LogicalName: 'account',     DisplayName: { UserLocalizedLabel: { Label: '取引先企業' } }, IsCustomEntity: false, PrimaryIdAttribute: 'accountid' },
  { LogicalName: 'contact',     DisplayName: { UserLocalizedLabel: { Label: '取引先担当者' } }, IsCustomEntity: false, PrimaryIdAttribute: 'contactid' },
  { LogicalName: 'opportunity', DisplayName: { UserLocalizedLabel: { Label: '営業案件' } }, IsCustomEntity: false, PrimaryIdAttribute: 'opportunityid' },
  { LogicalName: 'lead',        DisplayName: { UserLocalizedLabel: { Label: 'リード' } }, IsCustomEntity: false, PrimaryIdAttribute: 'leadid' },
  { LogicalName: 'incident',    DisplayName: { UserLocalizedLabel: { Label: 'サポート案件' } }, IsCustomEntity: false, PrimaryIdAttribute: 'incidentid' },
  { LogicalName: 'task',        DisplayName: { UserLocalizedLabel: { Label: 'タスク' } }, IsCustomEntity: false, PrimaryIdAttribute: 'activityid' },
  { LogicalName: 'cr123_order', DisplayName: { UserLocalizedLabel: { Label: '受注 (カスタム)' } }, IsCustomEntity: true, PrimaryIdAttribute: 'cr123_orderid' },
];

const DEMO_COLUMNS = {
  account: [
    { LogicalName: 'accountid',   DisplayName: { UserLocalizedLabel: { Label: '取引先企業ID' } }, AttributeType: 'Uniqueidentifier', IsPrimaryId: true,  IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'name',        DisplayName: { UserLocalizedLabel: { Label: '取引先企業名' } }, AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: true,  IsCustomAttribute: false, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'telephone1',  DisplayName: { UserLocalizedLabel: { Label: '電話' } },         AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'emailaddress1',DisplayName:{ UserLocalizedLabel: { Label: 'メール' } },        AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'websiteurl',  DisplayName: { UserLocalizedLabel: { Label: 'Web サイト' } },   AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'revenue',     DisplayName: { UserLocalizedLabel: { Label: '年間売上' } },      AttributeType: 'Money',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'numberofemployees', DisplayName: { UserLocalizedLabel: { Label: '従業員数' } }, AttributeType: 'Integer',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'industrycode',DisplayName: { UserLocalizedLabel: { Label: '業種' } },          AttributeType: 'Picklist',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'ownerid',     DisplayName: { UserLocalizedLabel: { Label: '所有者' } },        AttributeType: 'Owner',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'createdon',   DisplayName: { UserLocalizedLabel: { Label: '作成日' } },        AttributeType: 'DateTime',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'statecode',   DisplayName: { UserLocalizedLabel: { Label: '状態' } },          AttributeType: 'State',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
  ],
  contact: [
    { LogicalName: 'contactid',   DisplayName: { UserLocalizedLabel: { Label: '取引先担当者ID' } }, AttributeType: 'Uniqueidentifier', IsPrimaryId: true,  IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'fullname',    DisplayName: { UserLocalizedLabel: { Label: 'フルネーム' } },     AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: true,  IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'firstname',   DisplayName: { UserLocalizedLabel: { Label: '名' } },             AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'lastname',    DisplayName: { UserLocalizedLabel: { Label: '姓' } },             AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'accountid',   DisplayName: { UserLocalizedLabel: { Label: '取引先企業' } },     AttributeType: 'Lookup',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'emailaddress1',DisplayName:{ UserLocalizedLabel: { Label: 'メール' } },          AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'mobilephone', DisplayName: { UserLocalizedLabel: { Label: '携帯電話' } },       AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'birthdate',   DisplayName: { UserLocalizedLabel: { Label: '誕生日' } },         AttributeType: 'DateTime',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'ownerid',     DisplayName: { UserLocalizedLabel: { Label: '所有者' } },         AttributeType: 'Owner',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
  ],
  opportunity: [
    { LogicalName: 'opportunityid', DisplayName: { UserLocalizedLabel: { Label: '営業案件ID' } },   AttributeType: 'Uniqueidentifier', IsPrimaryId: true,  IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'name',          DisplayName: { UserLocalizedLabel: { Label: '営業案件名' } },   AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: true,  IsCustomAttribute: false, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'accountid',     DisplayName: { UserLocalizedLabel: { Label: '取引先企業' } },   AttributeType: 'Lookup',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'parentcontactid', DisplayName: { UserLocalizedLabel: { Label: '取引先担当者' } }, AttributeType: 'Lookup',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'estimatedvalue', DisplayName: { UserLocalizedLabel: { Label: '見込み売上' } },  AttributeType: 'Money',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'closeprobability', DisplayName: { UserLocalizedLabel: { Label: '受注確度 (%)' } }, AttributeType: 'Integer',       IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'estimatedclosedate', DisplayName: { UserLocalizedLabel: { Label: '完了予定日' } }, AttributeType: 'DateTime',      IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'stepname',      DisplayName: { UserLocalizedLabel: { Label: 'プロセス段階' } },  AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'statecode',     DisplayName: { UserLocalizedLabel: { Label: '状態' } },          AttributeType: 'State',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
  ],
  lead: [
    { LogicalName: 'leadid',      DisplayName: { UserLocalizedLabel: { Label: 'リードID' } },        AttributeType: 'Uniqueidentifier', IsPrimaryId: true,  IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'fullname',    DisplayName: { UserLocalizedLabel: { Label: 'フルネーム' } },       AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: true,  IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'companyname', DisplayName: { UserLocalizedLabel: { Label: '会社名' } },           AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'emailaddress1',DisplayName:{ UserLocalizedLabel: { Label: 'メール' } },            AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'leadqualitycode', DisplayName: { UserLocalizedLabel: { Label: '評価' } },         AttributeType: 'Picklist',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'estimatedvalue', DisplayName: { UserLocalizedLabel: { Label: '見込み金額' } },    AttributeType: 'Money',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'statecode',   DisplayName: { UserLocalizedLabel: { Label: '状態' } },             AttributeType: 'State',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
  ],
  incident: [
    { LogicalName: 'incidentid',  DisplayName: { UserLocalizedLabel: { Label: 'サポート案件ID' } },  AttributeType: 'Uniqueidentifier', IsPrimaryId: true,  IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'title',       DisplayName: { UserLocalizedLabel: { Label: 'タイトル' } },         AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: true,  IsCustomAttribute: false, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'customerid',  DisplayName: { UserLocalizedLabel: { Label: '顧客' } },             AttributeType: 'Customer',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'casetypecode',DisplayName: { UserLocalizedLabel: { Label: '種類' } },             AttributeType: 'Picklist',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'prioritycode',DisplayName: { UserLocalizedLabel: { Label: '優先度' } },           AttributeType: 'Picklist',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'statecode',   DisplayName: { UserLocalizedLabel: { Label: '状態' } },             AttributeType: 'State',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'createdon',   DisplayName: { UserLocalizedLabel: { Label: '作成日' } },           AttributeType: 'DateTime',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
  ],
  task: [
    { LogicalName: 'activityid',  DisplayName: { UserLocalizedLabel: { Label: 'タスクID' } },         AttributeType: 'Uniqueidentifier', IsPrimaryId: true,  IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'subject',     DisplayName: { UserLocalizedLabel: { Label: '件名' } },             AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: true,  IsCustomAttribute: false, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'regardingobjectid', DisplayName: { UserLocalizedLabel: { Label: '関連' } },       AttributeType: 'Lookup',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'scheduledend',DisplayName: { UserLocalizedLabel: { Label: '期日' } },             AttributeType: 'DateTime',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'prioritycode',DisplayName: { UserLocalizedLabel: { Label: '優先度' } },           AttributeType: 'Picklist',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'statecode',   DisplayName: { UserLocalizedLabel: { Label: '状態' } },             AttributeType: 'State',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: false, RequiredLevel: { Value: 'SystemRequired' } },
  ],
  cr123_order: [
    { LogicalName: 'cr123_orderid', DisplayName: { UserLocalizedLabel: { Label: '受注ID' } },         AttributeType: 'Uniqueidentifier', IsPrimaryId: true,  IsPrimaryName: false, IsCustomAttribute: true, RequiredLevel: { Value: 'SystemRequired' } },
    { LogicalName: 'cr123_name',    DisplayName: { UserLocalizedLabel: { Label: '受注番号' } },       AttributeType: 'String',           IsPrimaryId: false, IsPrimaryName: true,  IsCustomAttribute: true, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'cr123_accountid', DisplayName: { UserLocalizedLabel: { Label: '取引先企業' } },   AttributeType: 'Lookup',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: true, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'cr123_opportunityid', DisplayName: { UserLocalizedLabel: { Label: '営業案件' } }, AttributeType: 'Lookup',           IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: true, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'cr123_totalamount', DisplayName: { UserLocalizedLabel: { Label: '合計金額' } },   AttributeType: 'Money',            IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: true, RequiredLevel: { Value: 'None' } },
    { LogicalName: 'cr123_orderdate',   DisplayName: { UserLocalizedLabel: { Label: '受注日' } },     AttributeType: 'DateTime',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: true, RequiredLevel: { Value: 'ApplicationRequired' } },
    { LogicalName: 'cr123_statuscode',  DisplayName: { UserLocalizedLabel: { Label: 'ステータス' } }, AttributeType: 'Picklist',         IsPrimaryId: false, IsPrimaryName: false, IsCustomAttribute: true, RequiredLevel: { Value: 'SystemRequired' } },
  ],
};

const DEMO_RELATIONS = {
  contact: [
    { SchemaName: 'contact_customer_accounts', ReferencingEntity: 'contact', ReferencedEntity: 'account', ReferencingAttribute: 'accountid' },
  ],
  opportunity: [
    { SchemaName: 'opportunity_customer_accounts', ReferencingEntity: 'opportunity', ReferencedEntity: 'account', ReferencingAttribute: 'accountid' },
    { SchemaName: 'opportunity_customer_contacts', ReferencingEntity: 'opportunity', ReferencedEntity: 'contact', ReferencingAttribute: 'parentcontactid' },
  ],
  incident: [
    { SchemaName: 'incident_customer_accounts', ReferencingEntity: 'incident', ReferencedEntity: 'account', ReferencingAttribute: 'customerid' },
  ],
  cr123_order: [
    { SchemaName: 'cr123_order_account', ReferencingEntity: 'cr123_order', ReferencedEntity: 'account', ReferencingAttribute: 'cr123_accountid' },
    { SchemaName: 'cr123_order_opportunity', ReferencingEntity: 'cr123_order', ReferencedEntity: 'opportunity', ReferencingAttribute: 'cr123_opportunityid' },
  ],
  account: [], lead: [], task: [],
};

function loadDemo(onTableSelect) {
  // テーブル一覧表示
  allTables = DEMO_TABLES;
  activeTableNames = new Set();
  tableDetails = {};
  cardIndex = 0;
  Object.keys(cardPositions).forEach(k => delete cardPositions[k]);

  // キャンバスリセット
  const inner = document.getElementById('er-canvas-inner');
  inner.innerHTML = `<div class="canvas-empty" id="canvas-empty">
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.3">
      <rect x="8" y="8" width="20" height="28" rx="4" stroke="#555" stroke-width="2"/>
      <rect x="36" y="28" width="20" height="28" rx="4" stroke="#555" stroke-width="2"/>
      <path d="M28 22 L36 42" stroke="#555" stroke-width="2" stroke-dasharray="4 2"/>
    </svg>
    <p>左のリストからテーブルを選択すると<br>ER 図が表示されます</p>
  </div>`;
  canvasScale = 1; canvasPanX = 0; canvasPanY = 0;
  applyTransform(inner);

  renderTableList(DEMO_TABLES, activeTableNames, name => onDemoTableSelect(name));
  setStatus('デモモード — サンプル Dataverse スキーマを表示中', false);
}

function onDemoTableSelect(logicalName) {
  if (activeTableNames.has(logicalName)) {
    activeTableNames.delete(logicalName);
    document.getElementById(`card-${logicalName}`)?.remove();
    delete tableDetails[logicalName];
    renderTableList(DEMO_TABLES, activeTableNames, onDemoTableSelect);
    drawConnections(tableDetails);
    return;
  }

  activeTableNames.add(logicalName);
  renderTableList(DEMO_TABLES, activeTableNames, onDemoTableSelect);

  const table   = DEMO_TABLES.find(t => t.LogicalName === logicalName);
  const columns  = DEMO_COLUMNS[logicalName] ?? [];
  const relations = DEMO_RELATIONS[logicalName] ?? [];

  tableDetails[logicalName] = { columns, relations };

  const index = cardIndex++;
  renderERCard(table, columns, relations, index, (t, col) => showDetailPanel(t, col));
  drawConnections(tableDetails);
  document.getElementById('canvas-empty')?.remove();
}
