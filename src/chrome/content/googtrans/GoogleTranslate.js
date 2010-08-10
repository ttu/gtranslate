Components.utils.import("resource://gtranslate/JSON.js");

let EXPORTED_SYMBOLS = ["GoogleTranslate"];

const Cc = Components.classes;
const Ci = Components.interfaces;

if ("undefined" === typeof(GoogleTranslate)) {

    var GoogleTranslate = {

        init: function() {
            this.mozPrefs = Cc["@mozilla.org/preferences-service;1"].getService(
                Ci.nsIPrefService);
            let prefs = this.prefs = this.mozPrefs.getBranch("googTrans.");
            // set default preferences
            if (!prefs.prefHasUserValue("from")) {
                prefs.setCharPref("from", "auto");
            }
            if (!prefs.prefHasUserValue("to")) {
                prefs.setCharPref("to", this.getDefaultTo());
            }
            if (!prefs.prefHasUserValue("detectpagelang")) {
                prefs.setBoolPref("detectpagelang", true);
            }
        },

        // get the default "to" lang
        getDefaultTo: function() {
            var currentLocale = this.mozPrefs.getBranch("general.").getCharPref(
                "useragent.locale");
            if (this.langConf.availableLangs_to.indexOf(currentLocale) !== -1) {
                return currentLocale;
            } else {
                return "en";
            }
        },

        translationRequest: function(langFrom, langTo, text, onLoadFn, onErrorFn) {
            var url = this.getGoogleUrl("api", langFrom, langTo, text);

            var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]  
                            .createInstance(Ci.nsIXMLHttpRequest);

           req.addEventListener("load", (function() {
               if (req.status !== 200) {
                   onErrorFn(req.statusText);
                   return;
               }

               var response = JSON.parse(req.responseText);

               if (!response.responseData || response.responseStatus !== 200) {
                   onErrorFn(response.responseDetails);
                   return;
               }

               var translatedText = response.responseData.translatedText;
               onLoadFn(translatedText, response.responseData.detectedSourceLanguage);
           }), false);

           req.addEventListener("error", onErrorFn, false);

           req.open("GET", url, true);
           req.send(null);
       },

       getGoogleUrl: function(urlType, langFrom, langTo, text) {

           var formattedUrl = '';

           switch (urlType) {

                // Google Translate API > JSON
                case "api":
                    formattedUrl = 'http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&format=text&langpair=' + langFrom + '%7C' + langTo + '&q=' + encodeURIComponent(text);
                    break;

                // Google Translate page
                case "page":
                    formattedUrl = 'http://translate.google.com/#' + langFrom + '%7C' + langTo + '%7C' + encodeURIComponent(text);
                    break;

                // Google Translate Dictionary
                case "dict":
                    formattedUrl = 'http://www.google.com/dictionary?langpair=' + langFrom + '%7C' + langTo + '&q=' + encodeURIComponent(text);
                    break;
            }

            return formattedUrl;
        },

        // languages
        langConf: {
            availableLangs_from: availableLangs_from,
            availableLangs_to: availableLangs_to,
            langDict: langDict
        },
    };

    (function() {
        this.init();
    }).apply(GoogleTranslate);
}

let availableLangs_from = ["auto,|,af,sq,ar,be,bg,ca,zh-CN,hr,cs,da,nl,en,et,",
                           "tl,fi,fr,gl,de,el,iw,hi,hu,is,id,ga,it,ja,ko,lv,",
                           "lt,mk,ms,mt,no,fa,pl,pt,ro,ru,sr,sk,sl,es,sw,sv,",
                           "th,tr,uk,vi,cy,yi"].join("");
let availableLangs_to =   ["af,sq,ar,be,bg,ca,zh-CN,zh-TW,hr,cs,da,nl,en,et,",
                           "tl,fi,fr,gl,de,el,iw,hi,hu,is,id,ga,it,ja,ko,lv,",
                           "lt,mk,ms,mt,no,fa,pl,pt,ro,ru,sr,sk,sl,es,sw,sv,",
                           "th,tr,uk,vi,cy,yi"].join("");
let langDict = {
    "auto": "auto",
    "af": "afrikaans",
    "sq": "albanian",
    "ar": "arabic",
    "be": "belarusian",
    "bg": "bulgarian",
    "ca": "catalan",
    "zh-CN": "chineseS",
    "zh-TW": "chineseT",
    "hr": "croatian",
    "cs": "czech",
    "da": "danish",
    "nl": "dutch",
    "en": "english",
    "et": "estonian",
    "tl": "filipino",
    "fi": "finnish",
    "fr": "french",
    "gl": "galician",
    "de": "german",
    "el": "greek",
    "iw": "hebrew",
    "hi": "hindi",
    "hu": "hungarian",
    "is": "icelandic",
    "id": "indonesian",
    "ga": "irish",
    "it": "italian",
    "ja": "japanese",
    "ko": "korean",
    "lv": "latvian",
    "lt": "lithuanian",
    "mk": "macedonian",
    "ms": "malay",
    "mt": "maltese",
    "no": "norwegian",
    "fa": "persian",
    "pl": "polish",
    "pt": "portuguese",
    "ro": "romanian",
    "ru": "russian",
    "sr": "serbian",
    "sk": "slovak",
    "sl": "slovenian",
    "es": "spanish",
    "sw": "swahili",
    "sv": "swedish",
    "th": "thai",
    "tr": "turkish",
    "uk": "ukrainian",
    "vi": "vietnamese",
    "cy": "welsh",
    "yi": "yiddish"
};
