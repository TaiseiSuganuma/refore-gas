# CLAUDE.md — gas-local-template

このディレクトリは **GAS プロジェクトの雛形** です。実プロジェクトではありません。
新規プロジェクト作成時にこの中身をコピーして使います。

GAS 共通の開発ルールはリポジトリルートの [`CLAUDE.md`](../../CLAUDE.md) を参照してください。

## 雛形の使い方

```bash
cp -r templates/gas-local-template projects/<new-project>
cd projects/<new-project>
npm install
# .clasp.json を作る（clasp create または clasp clone）
```

雛形に手を入れる場合は、影響範囲（既存プロジェクトへ反映するかどうか）をユーザーに確認してください。
