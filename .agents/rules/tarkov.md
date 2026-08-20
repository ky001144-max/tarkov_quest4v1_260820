---
trigger: always_on
---

1.모든 작업은 tarkov_quest4라는 폴더를 만들어 그안에서 작업
2.API 쿼리 (GraphQL API): tarkov.dev의 백엔드([https://api.tarkov.dev/graphql](https://api.tarkov.dev/graphql))에서 퀘스트 정보(tasks) 및 각 맵의 세부 정보를 가져와서 작업
3.좌표 데이터 형식: 퀘스트 목적지(Task Objective)는 In-game 3D → Web 2D로 좌표 변환하는데 변환 방식은 아래의 단계를 거쳐 사용하도록 함
1단계: 원본 3D 게임 좌표 데이터 수집
관련 파일:
tarkov-data-spt.mjs
tarkov-data.mjs
변환 과정:
게임 원본 데이터(또는 SPT 데이터)로부터 맵 내 스폰 지점, 탈출구(Extracts), 스위치, 루스 룻(Loose Loot), 포격 구역(Artillery Zone) 등의 원본 3D 게임 공간 좌표Vector3 ({ x, y, z })를 수집합니다.

2단계: 지도별 기준 축 및 방위각 변환 계수 적용
관련 파일:
map_coordinates.json
변환 과정:
각 맵 ID별로 3D 좌표 축 방향(x, z)과 방위각 기준 회전 각도(rotation) 변환 계수를 정의합니다.
예시 (Reserve 맵): 3D 게임 좌표를 지도 이미지 상의 방향에 맞추기 위해 회전 계수 195.2090도를 지정합니다.

3단계: 좌표 회전 연산 및 2D/3D 영역 변환 연산 (핵심 변환)
관련 파일:
update-maps.mjs
변환 과정:
회전 계수 바인딩 (Line 59, 454-456): map_coordinates.json의 회전 데이터를 읽어 맵 객체의 coordinateToCardinalRotation 속성에 지정합니다.
회전 변환 연산 rotatePoint (Line 1445–1468):
구역(Artillery Zone) 및 회전이 필요한 3D 영역 좌표를 2D 평면 이미지 좌표에 맞게 변환합니다.
원점을 중심점(centerX, centerY)으로 이동시킨 후, 회전 각도를 라디안(angleRadians)으로 변환합니다.
2D 삼각함수 회전 행렬 공식을 적용해 변환된 좌표를 산출합니다: $$x' = (x - centerX) \cdot \cos(\theta) - (z - centerY) \cdot \sin(\theta) + centerX$$ $$z' = (x - centerX) \cdot \sin(\theta) + (z - centerY) \cdot \cos(\theta) + centerY$$

4단계: 정제된 좌표 데이터 구조화 및 저장/업로드
관련 파일:
kv-delta.js
upload-s3.mjs
변환 과정:
변환 및 정제가 완료된 스폰 위치, 루스 룻, 탈출구 및 맵 메타데이터를 Cloudflare Key-Value (KV) 데이터베이스나 S3 스토리이제 JSON 데이터 형태로 업로드합니다.

5단계: 웹 지도(tarkov.dev 프론트엔드) 서빙
관련 파일:
public-api.mjs
변환 과정:
tarkov.dev 프론트엔드(웹 인터랙티브 지도)가 GraphQL / REST API를 통해 이 데이터를 받아, 2D 맵 이미지 위에 좌표를 매핑하여 아이콘 및 영역을 렌더링합니다.

4.퀘스트 내역 설정: quest-data.json 퀘스트 파일과 location 숫자 ID 매핑 표 참고해서 해당맵에서만 관련 퀘스트 나오게 표시 
5.UI및 기능: UI-3분할로 나눠서 화면에 표시, 왼쪽:2D맵을 표시, 오른쪽:해당맵의 퀘스트 내역 표시, 중앙:퀘스트 추가된 내역
기능-2D맵을 변경 할 수 있는 UI필요로 함, 분할된 오른쪽 UI에서 퀘스트 내역을 추가하면 중앙쪽 UI로 퀘스트가 추가되는데 추가된 퀘스트는 좌표값을 불러와 해당맵에 표시
