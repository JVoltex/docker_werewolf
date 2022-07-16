
# ランキング人狼
<img src="https://user-images.githubusercontent.com/26474260/104125977-64bcd580-539d-11eb-969a-8562af25f897.png" width=800px>

## 派生元
dr666m1/werewolf(https://github.com/dr666m1/docker_werewolf)

## 概要
人狼ゲームを起動するdockerイメージのリポジトリです。
オンラインで遊ぶにはパブリックIPのあるサーバーで起動するか、
[ngrok](https://ngrok.com/)などを利用する必要があります。

## 使い方（ホスト）
### dockerイメージ作成
pull後に以下のコマンドでDockerイメージを作成します。

```
docker build . -t werewolf
```

### dockerコンテナの起動・ゲーム開始

#### 変更がない場合
```
docker run -it --name werewolf_container -p 3000:3000 werewolf
```

#### 変更がある場合
ngrokを同コンテナで立ち上げる場合など。今はngrokはDockerfileからでなく手動で立ち上げています。
```
docker run -itd --name werewolf_container -p 3000:3000 werewolf /bin/sh
```

### ポートの公開
人狼ゲームが起動しているコンテナを公開します。

#### パブリックIPのあるサーバー
GCEなどパブリックIPのあるサーバーで起動する場合は、特別な操作は必要ありません。
ファイアウォールの設定などは各自確認してください。

#### それ以外の場合
手元のPCで起動する場合は[ngrok](https://ngrok.com/)を利用するのが簡単です。
ただ、無料枠での利用に`4 tunnels / ngrok process`という制限があるようです。


## 使い方（全員）
ここからは参加する全員の操作です。
ブラウザから人狼ゲームが起動しているIPアドレスにアクセスします。
以下のような画面が表示されたら名前を入力して入場してください。
ホストが指定した人数がそろったらゲームが開始します。

<img src="https://user-images.githubusercontent.com/26474260/104126034-a9487100-539d-11eb-8d4c-3666f1b351e8.png" width=800px>

## Q and A
### 役職は何が使える？
現在使える役職は以下です。要望があれば追加するかもしれません。
- 市民
- 人狼
- 占い師
- 霊媒師
- 狩人
- パン屋
- 狂人

### スマホからも遊べる？
UIはbulmaを利用しているので、スマホ画面にもいい感じに調整されるはずです。
