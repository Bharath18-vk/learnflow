import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => {
    return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();
};

export const triggerHaptic = async (type = 'light') => {
    try {
        if (!isNative()) {
            if (navigator?.vibrate) {
                if (type === 'light') navigator.vibrate(10);
                else if (type === 'medium') navigator.vibrate(20);
                else if (type === 'success') navigator.vibrate([15, 30, 15]);
            }
            return;
        }

        switch (type) {
            case 'light':
                await Haptics.impact({ style: ImpactStyle.Light });
                break;
            case 'medium':
                await Haptics.impact({ style: ImpactStyle.Medium });
                break;
            case 'heavy':
                await Haptics.impact({ style: ImpactStyle.Heavy });
                break;
            case 'success':
                await Haptics.notification({ type: NotificationType.Success });
                break;
            case 'warning':
                await Haptics.notification({ type: NotificationType.Warning });
                break;
            case 'error':
                await Haptics.notification({ type: NotificationType.Error });
                break;
            default:
                await Haptics.impact({ style: ImpactStyle.Light });
        }
    } catch (e) {
        // Silently handle if haptics is unsupported on current platform
    }
};
