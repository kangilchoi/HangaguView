var EC_MANAGE_PRODUCT_RECENT = {
    getRecentImageUrl : function()
    {
        var sStorageKey = 'localRecentProduct' + EC_SDE_SHOP_NUM;

        if (typeof(sessionStorage[sStorageKey]) !== 'undefined') {
            var sRecentData = sessionStorage.getItem(sStorageKey);
            var oJsonData = JSON.parse(sRecentData);
            var sImageSrc = '';

            if (oJsonData[0] !== undefined) {
                sImageSrc = oJsonData[0].sImgSrc;
            }
            
            document.location.replace('recentproduct://setinfo?simg_src=' + sImageSrc);
        }
    }
};

var EC_MANAGE_MEMBER = {
    // 카카오싱크 로그인
    kakaosyncLogin : function (clientSecret)
    {
        if (Kakao.isInitialized()) {
            Kakao.cleanup();
        }
        Kakao.init(clientSecret);

        Kakao.Auth.authorize({
            redirectUri: location.origin + '/Api/Member/Oauth2ClientCallback/kakao/'
        });
    }
};
window.addEventListener('load', function () {
    if (typeof window.navigator === 'undefined') {
        return false;
    }

    /**
     * MANAGE 전역 설정 값 리턴
     *
     * @param sOption
     * @returns {*}
     */
    var getManageConfig = function (sOption) {
        if (typeof window.EC_FRONT_JS_CONFIG_MANAGE === 'object') {
            if (sOption in window.EC_FRONT_JS_CONFIG_MANAGE) {
                return window.EC_FRONT_JS_CONFIG_MANAGE[sOption];
            }
        }

        return null;
    };

    // 프로토콜 체크까지 포함된다.
    if ('serviceWorker' in window.navigator) {
        var sCafeSWName = '/ind-script/sw.php';
        var sA2hsLogEndpoint = '/exec/front/manage/a2hs';
        var sA2hsLogKey = 'a2hs_manifest_name';

        var $manifest = document.querySelector('link[rel="manifest"]');
        var bHasManifest = !!$manifest;

        if (bHasManifest === true) {
            // start_url 로 들어온 경우 로깅
            if (location.pathname === '/' && location.search.indexOf('a2hs=1') !== -1) {
                var sManifestName = $manifest.href.split("/").pop();

                var sStoredManifestName = localStorage.getItem(sA2hsLogKey);
                if (!sStoredManifestName || sStoredManifestName !== sManifestName) {
                    if (window.fetch) {
                        fetch(sA2hsLogEndpoint, {
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            method: 'POST',
                            body: JSON.stringify({
                                ua: navigator.userAgent
                            })
                        })
                        .then(function (oResponse) {
                            localStorage.setItem(sA2hsLogKey, sManifestName);
                        });
                    }
                }
            }
        }

        var sUserAgent = (navigator.userAgent || '').toLowerCase();
        var sClientWebView = ((sUserAgent.indexOf('android') !== -1 && sUserAgent.indexOf('wv') !== -1)
            || sUserAgent.indexOf('cafe24plus') !== -1)
            ? 'T'
            : 'F';

        // 서비스워커 설치 검증
        var bIsWebView = getManageConfig('IS_WEB_VIEW') === 'T' || sClientWebView === 'T';
        navigator.serviceWorker.getRegistration('/')
        .then(function (oSWRegistration) {
            var bInstallable = true;

            // 등록된 서비스워커가 있을 경우, Cafe24 서비스워커인지 확인
            if (oSWRegistration) {
                var oSW = oSWRegistration.installing || oSWRegistration.waiting || oSWRegistration.active;

                if (oSW.scriptURL.indexOf(sCafeSWName) === -1) {
                    bInstallable = false;
                } else {
                    // cafe24 서비스워커면서 웹뷰 접근일 경우 서비스워커 삭제 (크롬 75.0.3770.67 버전 대응)
                    if (bIsWebView === true) {
                        return oSWRegistration.unregister().then(function () {
                            return false;
                        }).catch(function (oError) {
                            console.warn('unregisterError => ', oError, oError.message, oError.name);
                            return false;
                        });
                    }
                }
            }

            // 웹뷰인 경우 설치하지 않음
            if (bIsWebView === true) {
                bInstallable = false;
            }

            return bInstallable;
        })
        .then(function (bInstallable) {
            if (bInstallable === true) {
                var sRevision = getManageConfig('FW_MANIFEST_CACHE_REVISION');

                if (sRevision) {
                    sCafeSWName = sCafeSWName + '?v=' + sRevision;
                }

                return navigator.serviceWorker.register(sCafeSWName, {
                    scope: '/',
                    updateViaCache: 'all'
                }).catch(function (oError) {
                    console.warn('registerError => ', oError, oError.message, oError.name);
                });
            }
        });
    }
});