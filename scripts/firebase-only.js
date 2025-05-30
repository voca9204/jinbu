// Firebase Only 부암동 건축 점검 보고서 JavaScript - v3.0.0
// 단일 데이터 소스: Firebase Storage + Firestore

// 전역 변수
let currentCardData = {}; // 현재 카드별 이미지 데이터
let lightboxImages = []; // Lightbox용 이미지 배열
let currentLightboxIndex = 0;
let pendingUpload = null; // 압축 미리보기용 임시 데이터

// 카드 데이터 정의
const cardDefinitions = {
    landlord: [
        { id: 1, title: "건물외벽 곰팡이 청소", description: "외벽 곰팡이 제거 및 방수 처리", stars: "⭐⭐⭐⭐⭐" },
        { id: 2, title: "계단 난간 손잡이 설치", description: "안전을 위한 계단 난간 보강 및 손잡이 설치", stars: "⭐⭐⭐⭐⭐" },
        { id: 3, title: "2층 화장실 천장 누수", description: "천장 누수 원인 파악 및 보수", stars: "⭐⭐⭐⭐⭐" },
        { id: 4, title: "1층 바닥 보수", description: "바닥 균열 및 손상 부위 보수", stars: "⭐⭐⭐⭐⭐" },
        { id: 5, title: "2층 바닥 보수", description: "바닥재 교체 및 평탄화 작업", stars: "⭐⭐⭐⭐⭐" },
        { id: 6, title: "4층 화장실 바닥 누수", description: "화장실 바닥 방수 및 누수 차단", stars: "⭐⭐⭐⭐" },
        { id: 7, title: "조경 정리", description: "건물 주변 조경 정비 및 관리", stars: "⭐⭐⭐⭐" },
        { id: 8, title: "2층 폴딩도어 유격1", description: "폴딩도어 조정 및 유격 해결", stars: "⭐⭐⭐" },
        { id: 9, title: "2층 폴딩도어 유격2", description: "폴딩도어 추가 조정 작업", stars: "⭐⭐⭐" },
        { id: 10, title: "건물 외부 조명 점검", description: "외부 조명 교체 및 점검", stars: "⭐⭐" },
        { id: 11, title: "스위치 점검", description: "전기 스위치 점검 및 교체", stars: "⭐" },
        { id: 12, title: "통신함 커버", description: "통신함 커버 보수 및 교체", stars: "⭐" },
        { id: 13, title: "계단 손잡이 보수", description: "기존 계단 손잡이 부식 확인 및 보수", stars: "⭐" }
    ],
    tenant: [
        { id: 1, title: "카페 바테이블 처리", description: "전임차인이 설치한 카페 바테이블 철거 조건 협의", stars: "⭐" }
    ]
};

// Firebase 상태 업데이트
function updateFirebaseStatus(message, isError = false) {
    const statusElement = document.getElementById('firebase-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'firebase-status ' + (isError ? 'error' : 'success');
    }
    console.log(`🔥 Status: ${message}`);
}

// 압축 설정 가져오기
function getCompressionSetting() {
    const selected = document.querySelector('input[name="compression"]:checked');
    return selected ? selected.value : 'high';
}

// 이미지 압축 함수
function compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // 비율 유지하면서 리사이즈
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);
            
            // 압축된 blob 생성
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// 압축 설정별 파라미터
function getCompressionParams(setting) {
    switch(setting) {
        case 'original':
            return { quality: 0.95, maxWidth: 3840, maxHeight: 2160 };
        case 'high':
            return { quality: 0.8, maxWidth: 1920, maxHeight: 1080 };
        case 'ultra':
            return { quality: 0.6, maxWidth: 1280, maxHeight: 720 };
        default:
            return { quality: 0.8, maxWidth: 1920, maxHeight: 1080 };
    }
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024) * 10) / 10 + ' MB';
}

// 압축 미리보기 표시
async function showCompressionPreview(file, cardId) {
    const setting = getCompressionSetting();
    const params = getCompressionParams(setting);
    
    // 원본 정보
    document.getElementById('original-size').textContent = formatFileSize(file.size);
    const originalPreview = document.getElementById('original-preview');
    originalPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="원본">`;
    
    // 압축 처리
    let compressedFile = file;
    if (setting !== 'original') {
        updateFirebaseStatus('🗜️ 이미지 압축 중...');
        compressedFile = await compressImage(file, params.quality, params.maxWidth, params.maxHeight);
    }
    
    // 압축 결과 표시
    document.getElementById('compressed-size').textContent = formatFileSize(compressedFile.size);
    const compressedPreview = document.getElementById('compressed-preview');
    compressedPreview.innerHTML = `<img src="${URL.createObjectURL(compressedFile)}" alt="압축">`;
    
    // 압축률 계산
    const compressionRatio = Math.round((1 - compressedFile.size / file.size) * 100);
    updateFirebaseStatus(`🗜️ 압축 완료: ${compressionRatio}% 절약`);
    
    // 임시 저장
    pendingUpload = {
        originalFile: file,
        compressedFile: compressedFile,
        originalName: file.name, // 원본 파일 이름 보존
        cardId: cardId,
        compressionRatio: compressionRatio
    };
    
    // 모달 표시
    document.getElementById('compression-modal').style.display = 'flex';
}

// 압축 모달 닫기
function closeCompressionModal() {
    document.getElementById('compression-modal').style.display = 'none';
    pendingUpload = null;
    updateFirebaseStatus('✅ Firebase 연결됨');
}

// 업로드 확인
async function confirmUpload() {
    if (!pendingUpload) return;
    
    // pendingUpload 값을 임시 저장 (closeCompressionModal에서 null로 설정되기 전에)
    const uploadData = {
        compressedFile: pendingUpload.compressedFile,
        originalName: pendingUpload.originalName,
        cardId: pendingUpload.cardId
    };
    
    closeCompressionModal();
    
    // 저장된 값으로 업로드 수행
    const result = await uploadImageToFirebase(uploadData.compressedFile, uploadData.cardId, uploadData.originalName);
    if (result) {
        addImageToCard(uploadData.cardId, result);
    }
}

// Firebase Storage에 이미지 업로드
async function uploadImageToFirebase(file, cardId, originalName = null) {
    if (!window.firebaseReady) {
        updateFirebaseStatus('❌ Firebase 연결되지 않음', true);
        return null;
    }
    
    try {
        const { storage, firestore, ref, uploadBytes, getDownloadURL, collection, addDoc } = window.firebaseModules;
        
        updateFirebaseStatus('📤 Firebase 업로드 중...');
        
        // 원본 파일명 결정 (압축된 파일인 경우 originalName 사용, 아니면 file.name 사용)
        const fileBaseName = originalName || file.name || 'unknown';
        
        // 파일명 생성
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${cardId}_${timestamp}_${fileBaseName}`;
        const storageRef = ref(storage, `images/${fileName}`);
        
        // Firebase Storage에 업로드
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Firestore에 메타데이터 저장
        const docRef = await addDoc(collection(firestore, 'images'), {
            cardId: cardId,
            fileName: fileName,
            originalName: fileBaseName,
            url: downloadURL,
            size: file.size,
            uploadTime: new Date(),
            compressionSetting: getCompressionSetting()
        });
        
        console.log('✅ Firebase 업로드 완료:', downloadURL);
        updateFirebaseStatus('✅ 업로드 완료');
        
        return {
            id: docRef.id,
            url: downloadURL,
            fileName: fileName,
            name: fileBaseName,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Firebase 업로드 실패:', error);
        updateFirebaseStatus('❌ 업로드 실패: ' + error.message, true);
        return null;
    }
}

// Firebase에서 이미지 목록 불러오기
async function loadImagesFromFirebase() {
    if (!window.firebaseReady) {
        console.log('Firebase 연결되지 않아 건너뜀');
        return;
    }
    
    try {
        const { firestore, collection, query, orderBy, getDocs } = window.firebaseModules;
        
        updateFirebaseStatus('📥 이미지 불러오는 중...');
        
        // Firestore에서 이미지 메타데이터 가져오기
        const imagesCollection = collection(firestore, 'images');
        const q = query(imagesCollection, orderBy('uploadTime', 'asc'));
        const querySnapshot = await getDocs(q);
        
        currentCardData = {};
        let totalImages = 0;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const cardId = data.cardId;
            
            if (!currentCardData[cardId]) {
                currentCardData[cardId] = [];
            }
            
            currentCardData[cardId].push({
                id: doc.id,
                url: data.url,
                fileName: data.fileName,
                name: data.originalName || data.fileName,
                timestamp: data.uploadTime?.toDate?.()?.toISOString() || new Date().toISOString(),
                size: data.size || 0
            });
            
            totalImages++;
        });
        
        console.log(`📥 Firebase에서 ${totalImages}개 이미지 불러옴`);
        updateFirebaseStatus(`✅ ${totalImages}개 이미지 불러옴`);
        
        // UI 업데이트
        updateAllCarousels();
        
    } catch (error) {
        console.error('❌ Firebase 데이터 불러오기 실패:', error);
        updateFirebaseStatus('❌ 데이터 불러오기 실패', true);
    }
}

// 파일 업로드 처리
async function handleFileUpload(event, cardId) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            continue;
        }
        
        // 압축 설정이 원본이면 바로 업로드, 아니면 미리보기 표시
        const setting = getCompressionSetting();
        if (setting === 'original') {
            const result = await uploadImageToFirebase(file, cardId, file.name);
            if (result) {
                addImageToCard(cardId, result);
            }
        } else {
            await showCompressionPreview(file, cardId);
            break; // 한 번에 하나씩 처리
        }
    }
    
    // 파일 입력 초기화
    event.target.value = '';
}

// 카드에 이미지 추가
function addImageToCard(cardId, imageData) {
    if (!currentCardData[cardId]) {
        currentCardData[cardId] = [];
    }
    
    currentCardData[cardId].push(imageData);
    updateCarousel(cardId);
}

// 캐로셀 업데이트
function updateCarousel(cardId) {
    const carousel = document.getElementById(`carousel-${cardId}`);
    const counter = document.getElementById(`counter-${cardId}`);
    
    if (!carousel || !counter) return;
    
    const images = currentCardData[cardId] || [];
    
    if (images.length === 0) {
        carousel.innerHTML = '<div class="no-images">📷 사진을 추가해주세요</div>';
        counter.textContent = '0/0';
        return;
    }
    
    // 이미지 렌더링
    carousel.innerHTML = images.map((img, index) => `
        <div class="carousel-item">
            <img src="${img.url}" alt="${img.name}" onclick="openLightbox('${cardId}', ${index})">
            <button class="delete-image" onclick="deleteImage('${cardId}', ${index}, '${img.id}')" title="이미지 삭제">×</button>
        </div>
    `).join('');
    
    // 카운터 업데이트
    counter.textContent = `1/${images.length}`;
    
    // 첫 번째 이미지 표시
    showImage(cardId, 0);
}

// 모든 캐로셀 업데이트
function updateAllCarousels() {
    Object.keys(currentCardData).forEach(cardId => {
        updateCarousel(cardId);
    });
}

// 이미지 표시
function showImage(cardId, index) {
    const carousel = document.getElementById(`carousel-${cardId}`);
    const counter = document.getElementById(`counter-${cardId}`);
    const images = currentCardData[cardId] || [];
    
    if (images.length === 0) return;
    
    const validIndex = Math.max(0, Math.min(index, images.length - 1));
    const translateX = -validIndex * 100;
    
    carousel.style.transform = `translateX(${translateX}%)`;
    counter.textContent = `${validIndex + 1}/${images.length}`;
}

// 이전 이미지
function prevImage(cardId) {
    const images = currentCardData[cardId] || [];
    if (images.length <= 1) return;
    
    const counter = document.getElementById(`counter-${cardId}`);
    const current = parseInt(counter.textContent.split('/')[0]) - 1;
    const newIndex = current <= 0 ? images.length - 1 : current - 1;
    
    showImage(cardId, newIndex);
}

// 다음 이미지
function nextImage(cardId) {
    const images = currentCardData[cardId] || [];
    if (images.length <= 1) return;
    
    const counter = document.getElementById(`counter-${cardId}`);
    const current = parseInt(counter.textContent.split('/')[0]) - 1;
    const newIndex = current >= images.length - 1 ? 0 : current + 1;
    
    showImage(cardId, newIndex);
}

// 이미지 삭제
async function deleteImage(cardId, index, imageId) {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;
    
    try {
        if (window.firebaseReady) {
            const { firestore, doc, deleteDoc, storage, ref, deleteObject } = window.firebaseModules;
            
            updateFirebaseStatus('🗑️ 이미지 삭제 중...');
            
            // Firestore 문서 삭제
            await deleteDoc(doc(firestore, 'images', imageId));
            
            // Storage 파일 삭제 시도 (실패해도 계속 진행)
            try {
                const images = currentCardData[cardId] || [];
                const image = images[index];
                if (image && image.fileName) {
                    const storageRef = ref(storage, `images/${image.fileName}`);
                    await deleteObject(storageRef);
                }
            } catch (storageError) {
                console.warn('Storage 삭제 실패 (메타데이터는 삭제됨):', storageError);
            }
        }
        
        // 로컬 데이터에서 제거
        if (currentCardData[cardId]) {
            currentCardData[cardId].splice(index, 1);
        }
        
        updateCarousel(cardId);
        updateFirebaseStatus('✅ 이미지 삭제 완료');
        
    } catch (error) {
        console.error('이미지 삭제 실패:', error);
        updateFirebaseStatus('❌ 삭제 실패: ' + error.message, true);
    }
}

// Lightbox 열기
function openLightbox(cardId, index) {
    const images = currentCardData[cardId] || [];
    if (images.length === 0) return;
    
    lightboxImages = images;
    currentLightboxIndex = index;
    
    updateLightboxImage();
    document.getElementById('lightbox').style.display = 'flex';
}

// Lightbox 닫기
function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    lightboxImages = [];
    currentLightboxIndex = 0;
}

// Lightbox 이미지 업데이트
function updateLightboxImage() {
    if (lightboxImages.length === 0) return;
    
    const img = document.getElementById('lightbox-image');
    const info = document.getElementById('lightbox-info');
    const current = lightboxImages[currentLightboxIndex];
    
    img.src = current.url;
    info.textContent = `${current.name} (${currentLightboxIndex + 1}/${lightboxImages.length})`;
}

// Lightbox 이전 이미지
function prevLightboxImage() {
    if (lightboxImages.length <= 1) return;
    currentLightboxIndex = currentLightboxIndex <= 0 ? lightboxImages.length - 1 : currentLightboxIndex - 1;
    updateLightboxImage();
}

// Lightbox 다음 이미지
function nextLightboxImage() {
    if (lightboxImages.length <= 1) return;
    currentLightboxIndex = currentLightboxIndex >= lightboxImages.length - 1 ? 0 : currentLightboxIndex + 1;
    updateLightboxImage();
}

// 카드 생성
function createCard(section, cardDef) {
    const cardId = `${section}-${cardDef.id}`;
    
    return `
        <div class="card" data-card-id="${cardId}">
            <div class="card-header">
                <div class="card-number">${cardDef.id}</div>
                <div class="stars">${cardDef.stars}</div>
            </div>
            <div class="image-gallery">
                <input type="file" id="fileInput-${cardId}" class="hidden" accept="image/*" multiple onchange="handleFileUpload(event, '${cardId}')">
                <input type="file" id="cameraInput-${cardId}" class="hidden" accept="image/*" capture="environment" onchange="handleFileUpload(event, '${cardId}')">
                <div class="image-controls">
                    <button class="btn btn-primary" onclick="document.getElementById('fileInput-${cardId}').click()">📷 사진 추가</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('cameraInput-${cardId}').click()">📸 카메라</button>
                </div>
                <div class="carousel-container" id="container-${cardId}">
                    <div class="carousel-track" id="carousel-${cardId}">
                        <div class="no-images">📷 사진을 추가해주세요</div>
                    </div>
                    <button class="carousel-nav prev" onclick="prevImage('${cardId}')">‹</button>
                    <button class="carousel-nav next" onclick="nextImage('${cardId}')">›</button>
                    <div class="image-counter" id="counter-${cardId}">0/0</div>
                </div>
            </div>
            <div class="card-title">${cardDef.title}</div>
            <div class="card-description">${cardDef.description}</div>
        </div>
    `;
}

// 모든 카드 생성
function createAllCards() {
    // 임대인 카드 생성
    const landlordContainer = document.getElementById('landlord-cards');
    if (landlordContainer) {
        landlordContainer.innerHTML = cardDefinitions.landlord
            .map(card => createCard('landlord', card))
            .join('');
    }
    
    // 전임차인 카드 생성
    const tenantContainer = document.getElementById('tenant-cards');
    if (tenantContainer) {
        tenantContainer.innerHTML = cardDefinitions.tenant
            .map(card => createCard('tenant', card))
            .join('');
    }
}

// 데이터 백업
function exportData() {
    const exportData = {
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        cardData: currentCardData,
        totalImages: Object.values(currentCardData).reduce((total, arr) => total + arr.length, 0)
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `jinbu-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    updateFirebaseStatus('📤 데이터 백업 완료');
}

// 데이터 복원
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.cardData) {
                currentCardData = importedData.cardData;
                updateAllCarousels();
                updateFirebaseStatus(`📥 ${importedData.totalImages || 0}개 이미지 복원 완료`);
            } else {
                throw new Error('잘못된 백업 파일 형식');
            }
        } catch (error) {
            alert('백업 파일을 읽을 수 없습니다: ' + error.message);
            updateFirebaseStatus('❌ 데이터 복원 실패', true);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// 모든 데이터 삭제
async function clearAllData() {
    const confirmed = confirm('모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
    if (!confirmed) return;
    
    try {
        updateFirebaseStatus('🗑️ 모든 데이터 삭제 중...');
        
        if (window.firebaseReady) {
            const { firestore, collection, getDocs, deleteDoc, doc } = window.firebaseModules;
            
            // Firestore 이미지 문서들 삭제
            const imagesCollection = collection(firestore, 'images');
            const querySnapshot = await getDocs(imagesCollection);
            
            const deletePromises = [];
            querySnapshot.forEach((documentSnapshot) => {
                deletePromises.push(deleteDoc(doc(firestore, 'images', documentSnapshot.id)));
            });
            
            await Promise.all(deletePromises);
        }
        
        // 로컬 데이터 삭제
        currentCardData = {};
        updateAllCarousels();
        
        updateFirebaseStatus('✅ 모든 데이터 삭제 완료');
        
    } catch (error) {
        console.error('데이터 삭제 실패:', error);
        updateFirebaseStatus('❌ 데이터 삭제 실패', true);
    }
}

// 디버그 정보 표시
function debugImageData() {
    console.log('=== Firebase Only 디버그 정보 ===');
    
    let totalImages = 0;
    const debugInfo = {};
    
    Object.keys(currentCardData).forEach(cardId => {
        const images = currentCardData[cardId] || [];
        debugInfo[cardId] = {
            count: images.length,
            images: images.map(img => ({
                name: img.name,
                id: img.id,
                size: img.size ? formatFileSize(img.size) : 'Unknown'
            }))
        };
        totalImages += images.length;
    });
    
    console.log('📊 카드별 이미지 정보:', debugInfo);
    console.log(`📈 총 이미지 개수: ${totalImages}개`);
    
    updateFirebaseStatus(`🔍 디버그 완료: 총 ${totalImages}개 이미지`);
    alert(`디버그 정보가 Console에 출력되었습니다.\n\n총 이미지: ${totalImages}개\n\n자세한 내용은 Console(F12)을 확인하세요.`);
}

// 압축 옵션 변경 이벤트
function setupCompressionOptions() {
    const options = document.querySelectorAll('input[name="compression"]');
    options.forEach(option => {
        option.addEventListener('change', function() {
            // 선택된 옵션 스타일 업데이트
            document.querySelectorAll('.compression-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.closest('.compression-option').classList.add('selected');
            
            console.log('압축 설정 변경:', this.value);
        });
    });
}

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Firebase Only v3.0.0 초기화 시작');
    
    // 카드 생성
    createAllCards();
    
    // 압축 옵션 설정
    setupCompressionOptions();
    
    // Firebase 연결 대기 후 데이터 로드
    const checkFirebaseAndLoad = () => {
        if (window.firebaseReady === true) {
            console.log('✅ Firebase 준비 완료, 데이터 로드 시작');
            updateFirebaseStatus('✅ Firebase 연결됨');
            loadImagesFromFirebase();
        } else if (window.firebaseReady === false) {
            console.log('❌ Firebase 연결 실패');
            updateFirebaseStatus('❌ Firebase 연결 실패', true);
        } else {
            // 아직 초기화 중
            setTimeout(checkFirebaseAndLoad, 100);
        }
    };
    
    checkFirebaseAndLoad();
    
    console.log('🎉 Firebase Only 초기화 완료');
});

// 키보드 이벤트 (Lightbox용)
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            prevLightboxImage();
        } else if (e.key === 'ArrowRight') {
            nextLightboxImage();
        }
    }
});