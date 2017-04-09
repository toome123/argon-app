import * as URI from 'urijs';
import * as application from 'application';
import * as utils from 'utils/utils';
import {SearchBar} from 'ui/search-bar';
import {Page} from 'ui/page';
import {Button} from 'ui/button';
import {View} from 'ui/core/view';
import {HtmlView} from 'ui/html-view'
import {Color} from 'color';
import {PropertyChangeData, EventData} from 'data/observable';
import {AnimationCurve} from 'ui/enums'
import {GestureTypes} from 'ui/gestures'

import {BrowserView} from './components/browser-view';
import * as bookmarks from './components/common/bookmarks';
import {appViewModel, AppViewModel, LoadUrlEventData} from './components/common/AppViewModel';
import {getScreenOrientation, updateScreenOrientation} from './components/common/util';

import { handleOpenURL, AppURL } from 'nativescript-urlhandler';

const matchArgonScheme = /^(argon|argon4)/;

handleOpenURL((appURL: AppURL) => {
    console.log('Received url request: ', appURL);
    const layer = browserView.addLayer();
    browserView.setFocussedLayer(layer);
    const webView = layer.webView!;
    webView.src = appURL.path.replace(matchArgonScheme, 'https');
});

//import trace = require("trace");
//trace.setCategories(trace.categories.Debug);
//trace.enable();

// import {RealityViewer} from '@argonjs/argon'

//import * as orientationModule from 'nativescript-screen-orientation';
var orientationModule = require("nativescript-screen-orientation");

export let page:Page;
export let layout:View;
export let touchOverlayView:View;
export let headerView:View;
export let menuView:View;
export let browserView:BrowserView;
export let bookmarksView:View;
export let realityChooserView:View;

let searchBar:SearchBar;
let iosSearchBarController:IOSSearchBarController;
let androidSearchBarController:AndroidSearchBarController;

appViewModel.on('propertyChange', (evt:PropertyChangeData)=>{
    if (evt.propertyName === 'currentUri') {
        setSearchBarText(appViewModel.currentUri);
    }
    else if (evt.propertyName === 'viewerEnabled') {
        // const vuforiaDelegate = appViewModel.manager.container.get(Argon.VuforiaServiceDelegate);
        // vuforiaDelegate.viewerEnabled = evt.value;
        if (evt.value) {
            orientationModule.setCurrentOrientation("landscape");
        } else {
            orientationModule.setCurrentOrientation("portrait");
            orientationModule.setCurrentOrientation("all");
        }

    }
    else if (evt.propertyName === 'menuOpen') {
        if (evt.value) {
            appViewModel.hideOverview();
            menuView.visibility = "visible";
            menuView.animate({
                scale: {
                    x: 1,
                    y: 1,
                },
                duration: 150,
                opacity: 1,
                curve: AnimationCurve.easeInOut
            });
            touchOverlayView.visibility = 'visible';
            touchOverlayView.on(GestureTypes.touch,()=>{
                touchOverlayView.off(GestureTypes.touch);
                touchOverlayView.visibility = 'collapse';
                appViewModel.hideMenu();
            });
        } else {
            menuView.animate({
                scale: {
                    x: 0,
                    y: 0,
                },
                duration: 150,
                opacity: 0,
                curve: AnimationCurve.easeInOut
            }).then(() => {
                menuView.visibility = "collapse";
            });
            touchOverlayView.off(GestureTypes.touch);
            touchOverlayView.visibility = 'collapse';
        }
    }
    else if (evt.propertyName === 'overviewOpen') {
        if (evt.value) {
            browserView.showOverview();
            appViewModel.hideBookmarks();
            searchBar.animate({
                translate: {x:-100, y:0},
                opacity: 0,
                curve: AnimationCurve.easeInOut
            }).then(()=>{
                searchBar.visibility = 'collapse';
            })
            const addButton = headerView.getViewById('addButton');
            addButton.visibility = 'visible';
            addButton.opacity = 0;
            addButton.translateX = -10;
            addButton.animate({
                translate: {x:0,y:0},
                opacity:1
            })
        } else {
            browserView.hideOverview();
            if (!appViewModel.layerDetails.uri) appViewModel.showBookmarks();
            searchBar.visibility = 'visible';
            searchBar.animate({
                translate: {x:0, y:0},
                opacity: 1,
                curve: AnimationCurve.easeInOut
            })
            const addButton = headerView.getViewById('addButton');
            addButton.animate({
                translate: {x:-10, y:0},
                opacity:0
            }).then(()=>{
                addButton.visibility = 'collapse';
            })
        }
    }
    else if (evt.propertyName === 'realityChooserOpen') {
        if (evt.value) {
            realityChooserView.visibility = 'visible';
            realityChooserView.animate({
                scale: {
                    x:1,
                    y:1
                },
                opacity:1,
                duration: 150,
                curve: AnimationCurve.easeInOut
            })
            appViewModel.showCancelButton();
        } else {
            realityChooserView.animate({
                scale: {
                    x:1,
                    y:1
                },
                opacity:0,
                duration: 150,
                curve: AnimationCurve.easeInOut
            }).then(()=>{
                realityChooserView.visibility = 'collapse';
                realityChooserView.scaleX = 0.9;
                realityChooserView.scaleY = 0.9;
            })
            blurSearchBar();
            appViewModel.hideCancelButton();
        }
    }
    else if (evt.propertyName === 'bookmarksOpen') {
        if (evt.value) {
            bookmarksView.visibility = 'visible';
            bookmarksView.animate({
                scale: {
                    x:1,
                    y:1
                },
                opacity:1,
                duration: 150,
                curve: AnimationCurve.easeInOut
            })
        } else {
            bookmarksView.animate({
                scale: {
                    x:1,
                    y:1
                },
                opacity:0,
                duration: 150,
                curve: AnimationCurve.easeInOut
            }).then(()=>{
                bookmarksView.visibility = 'collapse';
                bookmarksView.scaleX = 0.9;
                bookmarksView.scaleY = 0.9;
            })
            blurSearchBar();
            appViewModel.hideCancelButton();
        }
    } 
    else if (evt.propertyName === 'cancelButtonShown') {
        if (evt.value) {
            const overviewButton = headerView.getViewById('overviewButton');
            overviewButton.animate({
                opacity:0
            }).then(()=>{
                overviewButton.visibility = 'collapse';
            })
            const menuButton = headerView.getViewById('menuButton');
            menuButton.animate({
                opacity:0
            }).then(()=>{
                menuButton.visibility = 'collapse';
            })
            const cancelButton = headerView.getViewById('cancelButton');
            cancelButton.visibility = 'visible';
            cancelButton.animate({
                opacity:1
            });
        } else {
            const overviewButton = headerView.getViewById('overviewButton');
            overviewButton.visibility = 'visible';
            overviewButton.animate({
                opacity:1
            })
            const menuButton = headerView.getViewById('menuButton');
            menuButton.visibility = 'visible';
            menuButton.animate({
                opacity:1
            })
            const cancelButton = headerView.getViewById('cancelButton');
            cancelButton.animate({
                opacity:0
            }).then(()=>{
                cancelButton.visibility = 'collapse';
            })
            
            layout.off(GestureTypes.touch);
        }
    }
})

export function pageLoaded(args) {

    /*
    page = args.object;
    page.bindingContext = appViewModel;
    appViewModel.setReady();

    // Set the icon for the menu button
    const menuButton = <Button> page.getViewById("menuButton");
    menuButton.text = String.fromCharCode(0xe5d4);

    // Set the icon for the overview button
    const overviewButton = <Button> page.getViewById("overviewButton");
    overviewButton.text = String.fromCharCode(0xe53b);
    */
}

export function navigatedTo(args) {
    
    page = args.object;
    page.bindingContext = appViewModel;
    appViewModel.setReady();

    // Set the icon for the menu button
    const menuButton = <Button> page.getViewById("menuButton");
    menuButton.text = String.fromCharCode(0xe5d4);

    // Set the icon for the overview button
    const overviewButton = <Button> page.getViewById("overviewButton");
    overviewButton.text = String.fromCharCode(0xe53b);

    // focus on the topmost layer
    browserView.setFocussedLayer(browserView.layers[browserView.layers.length-1]);

    // workaround (see https://github.com/NativeScript/NativeScript/issues/659)
    if (page.ios) {
        setTimeout(()=>{
            page.requestLayout();
        }, 0)
        application.ios.addNotificationObserver(UIApplicationDidBecomeActiveNotification, () => {
            page.requestLayout();
        });
    }
    
    appViewModel.showBookmarks();
    
    appViewModel.argon.session.errorEvent.addEventListener((error)=>{
        // alert(error.message + '\n' + error.stack);
        if (error.stack) console.log(error.message + '\n' + error.stack);
    })

    application.on(application.orientationChangedEvent, (args)=>{
        updateScreenOrientation();
        setTimeout(()=>{
            updateScreenOrientation();
            const orientation = getScreenOrientation();
            if (orientation === 90 || orientation === -90 || appViewModel.viewerEnabled) {
                page.actionBarHidden = true;
                if (page.android) {
                    let window = application.android.foregroundActivity.getWindow();
                    let decorView = window.getDecorView();
                    let uiOptions = (<any>android.view.View).SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | (<any>android.view.View).SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | (<any>android.view.View).SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | (<any>android.view.View).SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | (<any>android.view.View).SYSTEM_UI_FLAG_FULLSCREEN
                            | (<any>android.view.View).SYSTEM_UI_FLAG_HIDE_NAVIGATION;
                    decorView.setSystemUiVisibility(uiOptions);
                }
            } else {
                page.actionBarHidden = false;
                if (page.android) {
                    let window = application.android.foregroundActivity.getWindow();
                    let decorView = window.getDecorView();
                    let uiOptions = (<any>android.view.View).SYSTEM_UI_FLAG_VISIBLE;
                    decorView.setSystemUiVisibility(uiOptions);
                }
            }
        }, 500);
    });

    updateScreenOrientation();

    if (application.android) {
        var activity = application.android.foregroundActivity;
        activity.onBackPressed = () => {
            if (browserView.focussedLayer != browserView.realityLayer) {
                if (browserView.focussedLayer.webView && browserView.focussedLayer.webView.android.canGoBack()) {
                    browserView.focussedLayer.webView.android.goBack();
                }
            }
        }
    }

    appViewModel.on(AppViewModel.loadUrlEvent, (data:LoadUrlEventData)=>{
        browserView.loadUrl(data.url);
        blurSearchBar();
    })
}

application.on(application.resumeEvent, ()=> {
    if (application.android) {
        // on android the page is unloaded/reloaded after a suspend
        // open back to bookmarks if necessary
        if (appViewModel.bookmarksOpen) {
            // force a property change event
            appViewModel.notifyPropertyChange('bookmarksOpen', true);
        }
    }
});

export function layoutLoaded(args) {
    layout = args.object
    if (layout.ios) {
        layout.ios.layer.masksToBounds = false;
    }
}

export function headerLoaded(args) {
    headerView = args.object;
}

export function searchBarLoaded(args) {
    searchBar = args.object;

    searchBar.on(SearchBar.submitEvent, () => {
        let urlString = searchBar.text;
        if (urlString.indexOf('//') === -1) urlString = '//' + urlString;
        
        const url = URI(urlString);
        if (url.protocol() !== "http" && url.protocol() !== "https") {
            url.protocol("http");
        }
        setSearchBarText(url.toString());
        appViewModel.loadUrl(url.toString());
        appViewModel.hideBookmarks();
        appViewModel.hideRealityChooser();
        appViewModel.hideCancelButton();
        blurSearchBar();
    });

    if (application.ios) {
        iosSearchBarController = new IOSSearchBarController(searchBar);
    }

    if (application.android) {
        androidSearchBarController = new AndroidSearchBarController(searchBar);
    }
}

function setSearchBarText(url:string) {
    if (iosSearchBarController) {
        iosSearchBarController.setText(url);
    } else {
        androidSearchBarController.setText(url);
    }
}

function blurSearchBar() {
    searchBar.dismissSoftInput();
    if (searchBar.android) {
        searchBar.android.clearFocus();
    }
}

export function browserViewLoaded(args) {
    browserView = args.object;

    // Setup the debug view
    let debug:HtmlView = <HtmlView>browserView.page.getViewById("debug");
    debug.horizontalAlignment = 'stretch';
    debug.verticalAlignment = 'stretch';
    debug.backgroundColor = new Color(150, 255, 255, 255);
    debug.visibility = "collapsed";
    debug.isUserInteractionEnabled = false;
}


export function bookmarksViewLoaded(args) {
    bookmarksView = args.object;
    bookmarksView.scaleX = 0.9;
    bookmarksView.scaleY = 0.9;
    bookmarksView.opacity = 0;
}

export function realityChooserLoaded(args) {
    realityChooserView = args.object;
    realityChooserView.scaleX = 0.9;
    realityChooserView.scaleY = 0.9;
    realityChooserView.opacity = 0;
}

export function touchOverlayLoaded(args) {
    touchOverlayView = args.object;
}

// initialize some properties of the menu so that animations will render correctly
export function menuLoaded(args) {
    menuView = args.object;
    menuView.originX = 1;
    menuView.originY = 0;
    menuView.scaleX = 0;
    menuView.scaleY = 0;
    menuView.opacity = 0;
}

export function onSearchBarTap(args) {
    appViewModel.showBookmarks();
    appViewModel.showCancelButton();
}

export function onCancel(args) {
    if (!!appViewModel.layerDetails.uri) appViewModel.hideBookmarks();
    appViewModel.hideRealityChooser();
    appViewModel.hideCancelButton();
    blurSearchBar();
}

export function onAddChannel(args) {
    browserView.addLayer();
    appViewModel.hideMenu();
}

export function onReload(args) {
    browserView.focussedLayer.webView && browserView.focussedLayer.webView.reload();
}

export function onFavoriteToggle(args) {
    const url = appViewModel.layerDetails.uri;
    const bookmarkItem = bookmarks.favoriteMap.get(url);
    if (!bookmarkItem) {
        bookmarks.favoriteList.push(new bookmarks.BookmarkItem({
            uri: url,
            title: appViewModel.layerDetails.title
        }));
    } else {
        var i = bookmarks.favoriteList.indexOf(bookmarkItem);
        bookmarks.favoriteList.splice(i,1);
    }
}

export function onInteractionToggle(args) {
    appViewModel.toggleInteractionMode();
}

export function onOverview(args) {
    appViewModel.toggleOverview();
    appViewModel.setDebugEnabled(false);
    appViewModel.hideMenu();
}

export function onMenu(args) {
    appViewModel.toggleMenu();
}

export function onSelectReality(args) {
    appViewModel.showRealityChooser();
    appViewModel.showCancelButton();
    appViewModel.hideMenu();
}

export function onSettings(args) {
    //code to open the settings view goes here
    appViewModel.hideMenu();
}

export function onViewerToggle(args) {
    appViewModel.toggleViewer();
    appViewModel.hideMenu();
}

export function onDebugToggle(args) {
    appViewModel.toggleDebug();
}

class IOSSearchBarController {

    private uiSearchBar:UISearchBar;
    private textField:UITextField;

    constructor(public searchBar:SearchBar) {
        this.uiSearchBar = searchBar.ios;
        this.textField = this.uiSearchBar.valueForKey("searchField");

        this.uiSearchBar.keyboardType = UIKeyboardType.URL;
        this.uiSearchBar.autocapitalizationType = UITextAutocapitalizationType.None;
        this.uiSearchBar.searchBarStyle = UISearchBarStyle.Minimal;
        this.uiSearchBar.returnKeyType = UIReturnKeyType.Go;
        this.uiSearchBar.setImageForSearchBarIconState(UIImage.new(), UISearchBarIcon.Search, UIControlState.Normal)
        
        this.textField.leftViewMode = UITextFieldViewMode.Never;

        const textFieldEditHandler = () => {
            appViewModel.hideMenu();
            if (utils.ios.getter(UIResponder, this.uiSearchBar.isFirstResponder)) {
                if (browserView.focussedLayer === browserView.realityLayer) {
                    appViewModel.showRealityChooser();
                } else {
                    appViewModel.showBookmarks();
                }
                appViewModel.showCancelButton();
                
                setTimeout(()=>{
                    if (this.uiSearchBar.text === "") {
                        this.uiSearchBar.text = appViewModel.layerDetails.uri;
                        this.setPlaceholderText("");
                        this.textField.selectedTextRange = this.textField.textRangeFromPositionToPosition(this.textField.beginningOfDocument, this.textField.endOfDocument);
                    }
                }, 500)
                
                layout.on(GestureTypes.touch,()=>{
                    blurSearchBar();
                    layout.off(GestureTypes.touch);
                    if (!appViewModel.layerDetails.uri) appViewModel.hideCancelButton();
                });
            } else {
                this.setPlaceholderText(appViewModel.layerDetails.uri);
                this.uiSearchBar.text = "";
            }
        }

        application.ios.addNotificationObserver(UITextFieldTextDidBeginEditingNotification, textFieldEditHandler);
        application.ios.addNotificationObserver(UITextFieldTextDidEndEditingNotification, textFieldEditHandler);
    }

    private setPlaceholderText(text:string) {
        if (text) {
            var attributes: NSMutableDictionary<string,any> = NSMutableDictionary.new<string,any>().init();
            attributes.setObjectForKey(utils.ios.getter(UIColor,UIColor.blackColor), NSForegroundColorAttributeName);
            this.textField.attributedPlaceholder = NSAttributedString.alloc().initWithStringAttributes(text, attributes);
        } else {
            this.textField.placeholder = searchBar.hint;
        }
    }

    public setText(url) {
        if (!utils.ios.getter(UIResponder, this.uiSearchBar.isFirstResponder)) {
            this.setPlaceholderText(url);
        }
    }
}

class AndroidSearchBarController {

    private searchView:android.widget.SearchView;

    constructor(public searchBar:SearchBar) {
        this.searchView = searchBar.android;

        this.searchView.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_URI | android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        this.searchView.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_GO);
        this.searchView.clearFocus();

        const focusHandler = new android.view.View.OnFocusChangeListener({
            onFocusChange(v: android.view.View, hasFocus: boolean) {
                if (hasFocus) {
                    if (browserView.focussedLayer === browserView.realityLayer) {
                        appViewModel.showRealityChooser();
                    } else {
                        appViewModel.showBookmarks();
                    }
                    appViewModel.showCancelButton();
                }
            }
        });

        this.searchView.setOnQueryTextFocusChangeListener(focusHandler);

        // the nativescript implementation of OnQueryTextListener does not correctly handle the following case:
        // 1) an external event updates the query text (e.g. the user clicked a link on a page)
        // 2) the user attempts to navigate back to the previous page by updating the search bar text
        // 3) nativescript sees this as submitting the same query and treats it as a no-op
        // https://github.com/NativeScript/NativeScript/issues/3965
        const searchHandler = new android.widget.SearchView.OnQueryTextListener({
            onQueryTextChange(newText: String): boolean {
                searchBar._onPropertyChangedFromNative(SearchBar.textProperty, newText);
                return false;
            },
            onQueryTextSubmit(query: String): boolean {
                searchBar.notify(<EventData>{
                    eventName: SearchBar.submitEvent,
                    object: this
                });
                return true;
            }
        });

        this.searchView.setOnQueryTextListener(searchHandler);
    }

    public setText(url) {
        this.searchView.setQuery(url, false);
    }
}
