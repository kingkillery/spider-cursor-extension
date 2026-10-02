chrome.action.onClicked.addListener(async tab => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['spider.js']});
    await chrome.action.setBadgeText({tabId:tab.id,text:''});
    await chrome.action.setTitle({tabId:tab.id,title:'Toggle Neon Spider'});
  } catch (error) {
    console.warn('Neon Spider cannot run on this protected page:', error.message);
    await chrome.action.setBadgeText({tabId:tab.id,text:'!'});
    await chrome.action.setTitle({tabId:tab.id,title:'Open a normal webpage to use Neon Spider'});
  }
});
