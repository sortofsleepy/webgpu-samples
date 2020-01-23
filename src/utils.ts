

/**
 * Filters things out so that we can get the right context string between Safari and Chrome 
 */
export function getContextType(){
    let browser = window.navigator.userAgent;
    if(browser.search("Chrome") !== -1){
        return "gpupresent"
    }else if(browser.search("Chrome") === -1 && browser.search("Safari") !== -1 ){
        return "gpu";
    }
}