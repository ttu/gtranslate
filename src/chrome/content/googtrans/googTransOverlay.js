
/*
 * The UtilChrome global object is defined in UtilChrome.js which is
 * loaded from preferences.xul.
 */

Components.utils.import("resource://gtranslate/GoogleTranslate.js");

(function() {
    
    // Global vars
    var selection = '';
    var lastSelection = '';
    
    var curDetectedLang = "";
    var curTranslation = '';
    
    // XUL elements
    var elements = {};
    
    // App version check
    var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
    var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator);
    
    // Context menu
    var contextMenu;
    
    // On window load
    window.addEventListener("load", function() {
        
        contextMenu = UtilChrome.gid("contentAreaContextMenu") || UtilChrome.gid("mailContext");
        
        // XUL elements
        elements["gtranslate_popup"] = document.getElementById("gtranslate_popup");
        elements["gtranslate_strings"] = document.getElementById("gtranslate_strings");
        elements["gtranslate_separator"] = document.getElementById("gtranslate_separator");
        elements["gtranslate_main"] = document.getElementById("gtranslate_main");
        elements["gtranslate_result"] = document.getElementById("gtranslate_result");
        elements["gtranslate_replace"] = document.getElementById("gtranslate_replace");
        elements["gtranslate_langpair_separator"] = document.getElementById("gtranslate_langpair_separator");
        elements["gtranslate_langpair_main"] = document.getElementById("gtranslate_langpair_main");
        elements["gtranslate_langpair_popup"] = document.getElementById("gtranslate_langpair_popup");
        elements["gtranslate_dict"] = document.getElementById("gtranslate_dict");
		elements["gtranslate_quickresult"] = document.getElementById("gtranslate_quickresult");
        elements["gtranslate_langpairs"] = {};
        
        // Events
        initEvents();
        
        // Load langpairs list
        loadLangList();
        
    }, false);
    
    function initEvents() {
        
        // Right click
        contextMenu.addEventListener("popupshowing", onGtransPopup, false);
        
        // Init translate
        elements["gtranslate_popup"].addEventListener("popupshowing", initTranslate, false);
        
        // Open dictionay
        elements["gtranslate_dict"].addEventListener("command", openDict, false);
        
        // Replace with translation
        elements["gtranslate_replace"].addEventListener("command", replaceText, false);
        
        // Open Google Translate in a new tab
        elements["gtranslate_result"].addEventListener("command", openPage, false);
		elements["gtranslate_quickresult"].addEventListener("command", openPage, false);
    }
    
    // On right click event
    function onGtransPopup(event) {
        
        if (event.target !== contextMenu)  {
            return;
        }
        
        elements["gtranslate_dict"].setAttribute("disabled", (GoogleTranslate.getLangPair()[0] === "auto"));
        elements["gtranslate_replace"].setAttribute('hidden', true);
        elements["gtranslate_result"].setAttribute('disabled', true);
        
		elements["gtranslate_quickresult"].setAttribute('hidden', true);
		elements["gtranslate_quickresult"].setAttribute('disabled', true);
		
        curDetectedLang = "";
        
        var popupnode = document.popupNode;
        
        // Localized string : "Translate..."
        var translateWord = elements["gtranslate_strings"].getString("TranslateWord");
        
        // Get and trim current selection
        selection = GoogleTranslate.trim(getSelection(popupnode));
        
        // Show and update (eventually with a substr) gTranslate menu
        if (selection != '') {
            showMenu();
            elements["gtranslate_main"].setAttribute('label', translateWord + ' "' + selection.replace(/\s+/g," ") + '"');
			
			// If quick translate enabled 
			if (GoogleTranslate.getShowQuickResult())
				initTranslate();
				
        // Hide gTranslate
        } else {
            hideMenu();
        }
    }
    
    // Connect to Google Translate service
    function initTranslate() {
        
        var langpair = GoogleTranslate.getLangPair();
        var fromLang = (langpair[0] === "auto")? "" : langpair[0];
        var toLang = langpair[1];
        
        var changelang = elements["gtranslate_strings"].getString("ChangeLanguages");
        
        checkMenuItem(langpair[0], langpair[1]);
        
        elements["gtranslate_langpair_main"].setAttribute('label', changelang + " ( " + langpair.join(' > ') + " )");
        
        if (selection != '') {
        
            var connectgoogle = elements["gtranslate_strings"].getString("ConnectToGoogle");
            var strConnect = elements["gtranslate_strings"].getString("Connecting");
            
			elements["gtranslate_quickresult"].setAttribute('label', connectgoogle);
            elements["gtranslate_quickresult"].setAttribute('tooltiptext', null);
			
            elements["gtranslate_result"].setAttribute('label', connectgoogle);
            elements["gtranslate_result"].setAttribute('tooltiptext', null);
            
            GoogleTranslate.translationRequest(fromLang, toLang, selection,
                function(translation, detectedLang) { // on load
                    updateTranslation(translation);
                    
                    if (!!detectedLang) {
                        curDetectedLang = detectedLang;
                    }
                    
                    if (curDetectedLang !== "") {
                        elements["gtranslate_dict"].setAttribute("disabled", false);
                    }
                },
                function(errorMsg) { // on error
                    if (!errorMsg) {
                      errorMsg = elements["gtranslate_strings"].getString("ConnectionError");
                    }
                    
					elements["gtranslate_quickresult"].setAttribute('label', errorMsg);
                    elements["gtranslate_quickresult"].setAttribute('tooltiptext', errorMsg);
					
                    elements["gtranslate_result"].setAttribute('label', errorMsg);
                    elements["gtranslate_result"].setAttribute('tooltiptext', errorMsg);		
                }
            );
        }
    }
    
    // Update translation popup
    function updateTranslation(result) {
        
        lastSelection = selection;
        
        curTranslation = result;
        
        if (curTranslation == "") {
            var noTrans = elements["gtranslate_strings"].getString("NoTranslation");
            elements["gtranslate_result"].setAttribute('label', noTrans + ' "' + selection.replace(/\s+/g," ") + '"');
            elements["gtranslate_result"].setAttribute('tooltiptext', null);
			
			elements["gtranslate_quickresult"].setAttribute('label', noTrans + ' "' + selection.replace(/\s+/g," ") + '"');
            elements["gtranslate_quickresult"].setAttribute('tooltiptext', null);
            
        } else {
            elements["gtranslate_result"].setAttribute('label', curTranslation.replace(/\s+/g," "));
            elements["gtranslate_result"].setAttribute('tooltiptext', curTranslation);
            elements["gtranslate_result"].setAttribute('disabled', false);
            elements["gtranslate_replace"].setAttribute('disabled', false);
			
			elements["gtranslate_quickresult"].setAttribute('label', curTranslation.replace(/\s+/g," "));
            elements["gtranslate_quickresult"].setAttribute('tooltiptext', curTranslation);
            elements["gtranslate_quickresult"].setAttribute('disabled', false);
        }
        
        selection = '';
    }
    
    // Open Google Translation Page in a new tab
    function openPage() {
      openTab(GoogleTranslate.getGoogleUrl("page", GoogleTranslate.getLangPair()[0], GoogleTranslate.getLangPair()[1], lastSelection));
    }
    
    // Open Google Translation Dictionay in a new tab
    function openDict() {
        
        var gFromLang, gToLang;
        
        if (curDetectedLang !== "") {
            gFromLang = curDetectedLang;
            
        } else {
            gFromLang = GoogleTranslate.getLangPair()[0];
        }
        
        if (gFromLang !== "en") {
            gToLang = "en";
            
        } else {
            gToLang = GoogleTranslate.getLangPair()[1];
        }
        
        openTab(GoogleTranslate.getGoogleUrl("dict", gFromLang, gToLang, lastSelection));
    }
    
    function openTab(tabUrl) {
      
      // Thunderbird, Seamonkey Mail
      if (contextMenu.id === "mailContext") {
        var uri = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService).newURI(tabUrl, null, null);
        var httpHandler = Components.classes["@mozilla.org/uriloader/external-helper-app-service;1"]
                          .createInstance(Components.interfaces.nsIExternalProtocolService);
        httpHandler.loadUrl(uri);
        
      } else {
        
        // Firefox 3.6+
        if (versionChecker.compare(appInfo.platformVersion, "1.9.2") >= 0) {
          gBrowser.addTab(tabUrl, {relatedToCurrent: true});
          
        // Firefox < 3.6
        } else {
          gBrowser.addTab(tabUrl);
        }
      }
    }
    
    // Show menu
    function showMenu() {
        elements["gtranslate_main"].hidden = false;
        elements["gtranslate_separator"].hidden = false;
		
		if (GoogleTranslate.getShowQuickResult())
			elements["gtranslate_quickresult"].hidden = false;
    }
    
    // Hide menu
    function hideMenu() {
        elements["gtranslate_main"].hidden = true;
        elements["gtranslate_separator"].hidden = true;
		elements["gtranslate_quickresult"].hidden = true;
    }
    
    // Generates langlist menu
    function loadLangList() {
        
        function compareLangLabels(a, b) {
            if (elements["gtranslate_strings"].getString(
                    GoogleTranslate.langConf.langDict[a] + ".label") <
                elements["gtranslate_strings"].getString(
                    GoogleTranslate.langConf.langDict[b] + ".label")) {
                return -1;
            }
            return 1;
        };
        
        var fLangs = GoogleTranslate.langConf.availableLangs_from.split(",")
                        .slice(2).sort(compareLangLabels);
        var tLangs = GoogleTranslate.langConf.availableLangs_to.split(",")
                        .sort(compareLangLabels);
        
        fLangs.unshift("auto", "|");
        
        for (f in fLangs) {
        
            var m;
            
            if (fLangs[f] == '|') {
                m = document.createElement('menuseparator');
                
            } else {
                
                m = document.createElement('menu');
                
                elements["gtranslate_langpairs"][fLangs[f]] = {
                    "from": m,
                    "to": {}
                };
                
                m.setAttribute(
                    "label",
                    elements["gtranslate_strings"].getString(
                        GoogleTranslate.langConf.langDict[fLangs[f]] + ".label")
                );
                
                var mp = document.createElement('menupopup');
                m.appendChild(mp);
                
                for (t in tLangs) {
                    if (fLangs[f] != tLangs[t]) {
                    
                        var mi = document.createElement('menuitem');
                        
                        elements["gtranslate_langpairs"][fLangs[f]]["to"][tLangs[t]] = mi;
                        
                        mi.setAttribute(
                            "label",
                            elements["gtranslate_strings"].getString(
                                GoogleTranslate.langConf.langDict[tLangs[t]] + ".label")
                        );
                        mi.setAttribute("type", "radio");
                        
                        mi.addEventListener('command', (function() {
                        
                            var fromLang = fLangs[f];
                            var toLang = tLangs[t];
                            
                            return function() {
                                GoogleTranslate.setLangPair(fromLang, toLang);
                                lastSelection = '';
                            };
                            
                        })(), false);
                        
                        mp.appendChild(mi);
                    }
                }
            }
            
            elements['gtranslate_langpair_popup'].appendChild(m);
        }
    }
    
    // Visually select a lang pair
    function checkMenuItem(fromLang, toLang) {
        
        var element = elements["gtranslate_langpair_popup"];
        
        // Uncheck all...
        if (element.hasChildNodes()) {
            
            var menupopup = element.childNodes;
            
            for (var i = 0; i < menupopup.length; i++) {
            
                if (menupopup[i].hasChildNodes()) {
                
                    var children = element.childNodes;
                    
                    for (var j = 0; j < children.length; j++) {
                        children[j].removeAttribute("checked");
                    }
                }
            }
        }
        
        // Check langpair
        elements["gtranslate_langpairs"][fromLang]["from"].setAttribute("checked", "true");
        elements["gtranslate_langpairs"][fromLang]["to"][toLang].setAttribute("checked", "true");
    }
    
    function getSelection(popupnode) {
        
        var nodeLocalName = popupnode.localName.toLowerCase();
        var selection = '';
        
        // Input or textarea ?
        if ((nodeLocalName == "textarea") || (nodeLocalName == "input" && popupnode.type == "text")) {
            
            selection = popupnode.value.substring(popupnode.selectionStart, popupnode.selectionEnd);
            
            elements["gtranslate_replace"].setAttribute('hidden', false); /* TEMP */
           
        // Image ?
        } else if (nodeLocalName == "img") {
            
            // Image title ?
            if (popupnode.title) {
                selection = popupnode.title;
                
            // Image alternative ?
            } else if (popupnode.alt) {
                selection = popupnode.alt;
            }
            
        // Link ?
        } else if (nodeLocalName == "a" && popupnode.hasAttribute("href") && (popupnode.textContent != "" || popupnode.hasAttribute("title"))) {
            
            // Link content ?
            if (popupnode.textContent != "") {
                selection = popupnode.textContent;
                
            // Link title ?
            } else if (popupnode.hasAttribute("title")) {
                selection = popupnode.getAttribute("title");
            }
            
        // Text selection.
        } else {
            selection = document.commandDispatcher.focusedWindow.getSelection().toString();
        }
        
        return selection;
    }
    
    // Replace text in textarea or input[type=text]
    function replaceText() {
        var popupnode = document.popupNode;
        var iStart = popupnode.selectionStart;
        var iEnd = popupnode.selectionEnd;
        
        popupnode.value = popupnode.value.substring(0, iStart) + curTranslation + popupnode.value.substring(iEnd, popupnode.value.length);
        popupnode.setSelectionRange(iStart, iStart + curTranslation.length);
    }
    
})();
