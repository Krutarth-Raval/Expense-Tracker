package com.krutarth.expensetracker;

import android.content.Context;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTorch")
public class NativeTorchPlugin extends Plugin {
    private boolean isTorchOn = false;

    @PluginMethod
    public void setTorch(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("Must provide enabled boolean");
            return;
        }

        try {
            Context context = getContext();
            CameraManager manager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
            if (manager != null) {
                for (String id : manager.getCameraIdList()) {
                    CameraCharacteristics chars = manager.getCameraCharacteristics(id);
                    Boolean hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                    Integer facing = chars.get(CameraCharacteristics.LENS_FACING);
                    if (Boolean.TRUE.equals(hasFlash) && facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                        manager.setTorchMode(id, enabled);
                        isTorchOn = enabled;
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("enabled", enabled);
                        call.resolve(ret);
                        return;
                    }
                }
            }
            call.reject("No back camera with flash found");
        } catch (Exception e) {
            call.reject("Torch operation failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        try {
            Context context = getContext();
            CameraManager manager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
            if (manager != null) {
                for (String id : manager.getCameraIdList()) {
                    CameraCharacteristics chars = manager.getCameraCharacteristics(id);
                    Boolean hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                    Integer facing = chars.get(CameraCharacteristics.LENS_FACING);
                    if (Boolean.TRUE.equals(hasFlash) && facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                        JSObject ret = new JSObject();
                        ret.put("available", true);
                        call.resolve(ret);
                        return;
                    }
                }
            }
        } catch (Exception ignored) {}

        JSObject ret = new JSObject();
        ret.put("available", false);
        call.resolve(ret);
    }
}

