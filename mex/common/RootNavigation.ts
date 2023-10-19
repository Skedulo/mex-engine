export var navigationRef:any;

export function navigate(name:string, params:any) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    }
}

export function goBack() {
    if (navigationRef.isReady()) {
        navigationRef.goBack();
    }
}

export function getCurrentRouteName(){
    if (navigationRef.isReady()){
        return navigationRef.getCurrentRoute().name;
    }
    return null;
}

export function generateNavigationRef(newNavigationRef:any) {
    navigationRef = newNavigationRef
}
