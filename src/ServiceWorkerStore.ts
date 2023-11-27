import type { AsyncStorage }  from "oidc-client-ts";


/**
 * @public
 */
export class ServiceWorkerStore implements AsyncStorage {

    /** Returns the number of key/value pairs. */
    readonly length: Promise<number>;

    public constructor( ){ 
        length=0;
    }
    /**
     * Removes all key/value pairs, if there are any.
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     */
    public async clear(): Promise<void>{ 
        await sendMessage(getRegistration())({ type: 'clear', data: {  }});
    }
    /** Returns the current value associated with the given key, or null if the given key does not exist. */
    public async getItem(key: string): Promise<string | null>{ 
        const result = await sendMessage(getRegistration())({ type: 'getItem', data: { key: key } });
        return result.item;
    }
    /** Returns the name of the nth key, or null if n is greater than or equal to the number of key/value pairs. */
    public async key(index: number): Promise<string | null>{ 
        const result = await sendMessage(getRegistration())({ type: 'key', data: { index: index } });
        return result.key;
    }
    /**
     * Removes the key/value pair with the given key, if a key/value pair with the given key exists.
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     */
    public async removeItem(key: string): Promise<void>{ 
        await sendMessage(getRegistration())({ type: 'removeItem', data: { key: key }});
    }
    /**
     * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
     *
     * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     */
    public async setItem(key: string, value: string): Promise<void>{ 
        await sendMessage(getRegistration())({ type: 'setItem', data: { key: key , value: value} });
    }

    

} 

const sendMessage = (registration) => (data) : Promise<any> => {
    return new Promise(function(resolve, reject) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function (event) {
            if (event.data && event.data.error) {
                reject(event.data.error);
            } else {
                resolve(event.data);
            }
        };
        registration.active.postMessage(data, [messageChannel.port2]);
    });
}

let _sWRegistration;

export const startWorkerAsync = async(serviceWorkerRelativeUrl) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.serviceWorker || !serviceWorkerRelativeUrl) {
        return null;
    }
    const { name, version } = getBrowser();
    if (name === 'chrome' && parseInt(version) <= 70) {
        return null;
    }
    if (name === 'opera') {
        if (!version) {
            return null;
        }
        if (parseInt(version.split('.')[0]) < 80) {
            return null;
        }
    }
    if (name === 'ie') {
        return null;
    }

   const operatingSystem = getOperatingSystem(navigator);
    if (excludeOs(operatingSystem)) {
        return null;
    }

    const scope = process.env.SCOPE_SERVICE_WORKER;
    _sWRegistration = await navigator.serviceWorker.register(serviceWorkerRelativeUrl,{ scope : scope });
    //_sWRegistration = await navigator.serviceWorker.register(serviceWorkerRelativeUrl);

    try {
        await navigator.serviceWorker.ready;
    } catch (err) {
        console.log("err: ",err);
        return null;
    }
}

export const getRegistration = () => {
    return _sWRegistration;
};

const initAsync = async () => {
    await sendMessage(_sWRegistration)({
        type: 'init',
        data: {},
        configurationName:"default",
    });
    
    return {};
};

function getBrowser() {
    const ua = navigator.userAgent; let tem;
        let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name: 'ie', version: (tem[1] || '') };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\bOPR|Edge\/(\d+)/);

        if (tem != null) {
            let version = tem[1];
            if (!version) {
                const splits = ua.split(tem[0] + '/');
                if (splits.length > 1) {
                    version = splits[1];
                }
            }

            return { name: 'opera', version };
        }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
    return {
        name: M[0].toLowerCase(),
        version: M[1],
    };
}

export const getOperatingSystem = (navigator) => {
    const nVer = navigator.appVersion;
    const nAgt = navigator.userAgent;
    const unknown = '-';
    // system
    let os = unknown;
    const clientStrings = [
        { s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/ },
        { s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/ },
        { s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/ },
        { s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/ },
        { s: 'Windows Vista', r: /Windows NT 6.0/ },
        { s: 'Windows Server 2003', r: /Windows NT 5.2/ },
        { s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/ },
        { s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/ },
        { s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/ },
        { s: 'Windows 98', r: /(Windows 98|Win98)/ },
        { s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/ },
        { s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
        { s: 'Windows CE', r: /Windows CE/ },
        { s: 'Windows 3.11', r: /Win16/ },
        { s: 'Android', r: /Android/ },
        { s: 'Open BSD', r: /OpenBSD/ },
        { s: 'Sun OS', r: /SunOS/ },
        { s: 'Chrome OS', r: /CrOS/ },
        { s: 'Linux', r: /(Linux|X11(?!.*CrOS))/ },
        { s: 'iOS', r: /(iPhone|iPad|iPod)/ },
        { s: 'Mac OS X', r: /Mac OS X/ },
        { s: 'Mac OS', r: /(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
        { s: 'QNX', r: /QNX/ },
        { s: 'UNIX', r: /UNIX/ },
        { s: 'BeOS', r: /BeOS/ },
        { s: 'OS/2', r: /OS\/2/ },
        { s: 'Search Bot', r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/ },
    ];
    for (const id in clientStrings) {
        const cs = clientStrings[id];
        if (cs.r.test(nAgt)) {
            os = cs.s;
            break;
        }
    }

    let osVersion = unknown;

    if (/Windows/.test(os)) {
        // @ts-ignore: Object is possibly 'null'.
        osVersion = /Windows (.*)/.exec(os)[1];
        os = 'Windows';
    }

    switch (os) {
        case 'Mac OS':
        case 'Mac OS X':
        case 'Android':
            // @ts-ignore: Object is possibly 'null'.
            osVersion = /(?:Android|Mac OS|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh) ([._\d]+)/.exec(nAgt)[1];
            break;

        case 'iOS': {
            const osVersionArray = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
            // @ts-ignore: Object is possibly 'null'.
            osVersion = osVersionArray[1] + '.' + osVersionArray[2] + '.' + (parseInt(osVersionArray[3]) | 0);
            break;
        }
    }
    return {
        os,
        osVersion,
    };
};

export const excludeOs = (operatingSystem) => {
    if (operatingSystem.os === 'iOS' && operatingSystem.osVersion.startsWith('12')) {
        return true;
    }
    if (operatingSystem.os === 'Mac OS X' && operatingSystem.osVersion.startsWith('10_15_6')) {
        return true;
    }
    return false;
};



await startWorkerAsync('./node-modules/oidc-react-context-service-worker-ts/src/ServiceWorker.js');
initAsync();
