// api.js — Dataverse Web API クライアント

const MAX_COLUMNS_PER_TABLE = 200;

async function dvFetch(envUrl, path, token) {
  const base = envUrl.replace(/\/$/, '');
  const url = `${base}/api/data/v9.2/${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

// テーブル一覧（エンティティメタデータ）を取得
async function fetchTables(envUrl, token) {
  const select = [
    'LogicalName',
    'DisplayName',
    'PrimaryIdAttribute',
    'PrimaryNameAttribute',
    'Description',
    'IsCustomEntity',
    'EntitySetName',
  ].join(',');

  const data = await dvFetch(
    envUrl,
    `EntityDefinitions?$select=${select}&$filter=IsValidForAdvancedFind eq true`,
    token
  );

  return data.value.sort((a, b) => {
    const na = a.DisplayName?.UserLocalizedLabel?.Label ?? a.LogicalName;
    const nb = b.DisplayName?.UserLocalizedLabel?.Label ?? b.LogicalName;
    return na.localeCompare(nb, 'ja');
  });
}

// 特定テーブルの列情報を取得
async function fetchColumns(envUrl, logicalName, token) {
  const select = [
    'LogicalName',
    'DisplayName',
    'AttributeType',
    'IsPrimaryId',
    'IsPrimaryName',
    'IsCustomAttribute',
    'RequiredLevel',
    'Description',
  ].join(',');

  const data = await dvFetch(
    envUrl,
    `EntityDefinitions(LogicalName='${logicalName}')/Attributes?$select=${select}&$top=${MAX_COLUMNS_PER_TABLE}`,
    token
  );

  return data.value.sort((a, b) => {
    // PK → PrimaryName → その他
    if (a.IsPrimaryId) return -1;
    if (b.IsPrimaryId) return 1;
    if (a.IsPrimaryName) return -1;
    if (b.IsPrimaryName) return 1;
    const na = a.DisplayName?.UserLocalizedLabel?.Label ?? a.LogicalName;
    const nb = b.DisplayName?.UserLocalizedLabel?.Label ?? b.LogicalName;
    return na.localeCompare(nb, 'ja');
  });
}

// リレーション情報を取得（1対多）
async function fetchRelations(envUrl, logicalName, token) {
  try {
    const data = await dvFetch(
      envUrl,
      `EntityDefinitions(LogicalName='${logicalName}')/OneToManyRelationships?$select=SchemaName,ReferencingEntityNavigationPropertyName,ReferencedEntityNavigationPropertyName,ReferencingEntity,ReferencedEntity,ReferencingAttribute`,
      token
    );
    return data.value ?? [];
  } catch {
    return [];
  }
}

// 複数テーブルの詳細を並列取得
async function fetchTableDetails(envUrl, logicalNames, token, onProgress) {
  const results = {};
  let done = 0;

  await Promise.all(
    logicalNames.map(async (name) => {
      const [columns, relations] = await Promise.all([
        fetchColumns(envUrl, name, token),
        fetchRelations(envUrl, name, token),
      ]);
      results[name] = { columns, relations };
      done++;
      onProgress?.(done, logicalNames.length);
    })
  );

  return results;
}
