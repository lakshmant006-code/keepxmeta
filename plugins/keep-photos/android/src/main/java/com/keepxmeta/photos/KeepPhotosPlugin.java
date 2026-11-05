package com.keepxmeta.photos;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.exifinterface.media.ExifInterface;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Reads photos from the device library for Keep, newest first, one page at a time.
 * Each item is a small JPEG copy (long side about 900 px) with its date and, when the photo has one, its place.
 * Nothing is changed or deleted, and nothing leaves the phone.
 */
@CapacitorPlugin(
    name = "KeepPhotos",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_MEDIA_IMAGES }, alias = "images"),
        @Permission(strings = { Manifest.permission.READ_EXTERNAL_STORAGE }, alias = "storage"),
        @Permission(strings = { Manifest.permission.ACCESS_MEDIA_LOCATION }, alias = "location")
    }
)
public class KeepPhotosPlugin extends Plugin {

    private String mainAlias() {
        return Build.VERSION.SDK_INT >= 33 ? "images" : "storage";
    }

    @PluginMethod
    public void getMedias(PluginCall call) {
        if (getPermissionState(mainAlias()) != PermissionState.GRANTED) {
            String[] aliases = Build.VERSION.SDK_INT >= 29 ? new String[] { mainAlias(), "location" } : new String[] { mainAlias() };
            requestPermissionForAliases(aliases, call, "permissionsDone");
            return;
        }
        read(call);
    }

    /* On Android 14 a person can allow only some photos; the query then returns just those, so read either way. */
    @PermissionCallback
    private void permissionsDone(PluginCall call) {
        read(call);
    }

    private void read(PluginCall call) {
        int limit = Math.max(1, Math.min(call.getInt("limit", 30), 100));
        int offset = Math.max(0, call.getInt("offset", 0));
        int max = Math.max(200, call.getInt("thumb", 900));
        int quality = Math.max(40, Math.min(call.getInt("quality", 78), 95));
        ContentResolver cr = getContext().getContentResolver();
        Uri base = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        String[] proj = {
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DATE_TAKEN,
            MediaStore.Images.Media.DATE_ADDED
        };
        boolean wantsLocation = getPermissionState("location") == PermissionState.GRANTED;
        JSArray medias = new JSArray();
        try {
            Cursor c;
            if (Build.VERSION.SDK_INT >= 26) {
                Bundle q = new Bundle();
                q.putInt(ContentResolver.QUERY_ARG_LIMIT, limit);
                q.putInt(ContentResolver.QUERY_ARG_OFFSET, offset);
                q.putStringArray(ContentResolver.QUERY_ARG_SORT_COLUMNS, new String[] { MediaStore.Images.Media.DATE_TAKEN, MediaStore.Images.Media._ID });
                q.putInt(ContentResolver.QUERY_ARG_SORT_DIRECTION, ContentResolver.QUERY_SORT_DIRECTION_DESCENDING);
                c = cr.query(base, proj, q, null);
            } else {
                c = cr.query(base, proj, null, null, MediaStore.Images.Media.DATE_TAKEN + " DESC, " + MediaStore.Images.Media._ID + " DESC LIMIT " + limit + " OFFSET " + offset);
            }
            if (c == null) {
                call.reject("Could not read the photo library", "accessDenied");
                return;
            }
            SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            iso.setTimeZone(TimeZone.getTimeZone("UTC"));
            try {
                while (c.moveToNext()) {
                    long id = c.getLong(0);
                    long taken = c.getLong(1);
                    if (taken <= 0) taken = c.getLong(2) * 1000L;
                    Uri uri = ContentUris.withAppendedId(base, id);
                    JSObject item = one(cr, uri, max, quality, wantsLocation);
                    if (item == null) continue;
                    item.put("identifier", uri.toString());
                    item.put("creationDate", iso.format(new Date(taken)));
                    medias.put(item);
                }
            } finally {
                c.close();
            }
        } catch (SecurityException e) {
            call.reject("Photos access was not allowed", "accessDenied");
            return;
        } catch (Exception e) {
            call.reject("Could not read photos: " + e.getMessage(), "readError");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("medias", medias);
        ret.put("count", medias.length());
        call.resolve(ret);
    }

    /* one photo as a small JPEG, turned the right way up, with its place if it has one */
    private JSObject one(ContentResolver cr, Uri uri, int max, int quality, boolean wantsLocation) {
        try {
            BitmapFactory.Options bounds = new BitmapFactory.Options();
            bounds.inJustDecodeBounds = true;
            InputStream in = cr.openInputStream(uri);
            if (in == null) return null;
            BitmapFactory.decodeStream(in, null, bounds);
            in.close();
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null;
            int sample = 1;
            while (Math.max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= max) sample *= 2;
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inSampleSize = sample;
            in = cr.openInputStream(uri);
            if (in == null) return null;
            Bitmap bm = BitmapFactory.decodeStream(in, null, opts);
            in.close();
            if (bm == null) return null;

            int orientation = ExifInterface.ORIENTATION_NORMAL;
            double lat = 0, lng = 0;
            boolean hasPlace = false;
            Uri source = uri;
            if (wantsLocation && Build.VERSION.SDK_INT >= 29) {
                try {
                    source = MediaStore.setRequireOriginal(uri);
                } catch (Exception e) {
                    source = uri;
                }
            }
            try {
                InputStream ex = cr.openInputStream(source);
                if (ex != null) {
                    ExifInterface exif = new ExifInterface(ex);
                    orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
                    float[] ll = new float[2];
                    if (exif.getLatLong(ll)) {
                        lat = ll[0];
                        lng = ll[1];
                        hasPlace = true;
                    }
                    ex.close();
                }
            } catch (Exception e) {
                /* no EXIF, or location not allowed: carry on without a place */
            }

            int deg = 0;
            boolean flip = false;
            switch (orientation) {
                case ExifInterface.ORIENTATION_ROTATE_90: deg = 90; break;
                case ExifInterface.ORIENTATION_ROTATE_180: deg = 180; break;
                case ExifInterface.ORIENTATION_ROTATE_270: deg = 270; break;
                case ExifInterface.ORIENTATION_FLIP_HORIZONTAL: flip = true; break;
                case ExifInterface.ORIENTATION_FLIP_VERTICAL: flip = true; deg = 180; break;
                default: break;
            }
            if (deg != 0 || flip) {
                Matrix m = new Matrix();
                if (flip) m.postScale(-1f, 1f);
                if (deg != 0) m.postRotate(deg);
                Bitmap r = Bitmap.createBitmap(bm, 0, 0, bm.getWidth(), bm.getHeight(), m, true);
                if (r != bm) bm.recycle();
                bm = r;
            }
            int side = Math.max(bm.getWidth(), bm.getHeight());
            if (side > max) {
                float k = (float) max / side;
                Bitmap s = Bitmap.createScaledBitmap(bm, Math.round(bm.getWidth() * k), Math.round(bm.getHeight() * k), true);
                if (s != bm) bm.recycle();
                bm = s;
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bm.compress(Bitmap.CompressFormat.JPEG, quality, out);
            int w = bm.getWidth(), h = bm.getHeight();
            bm.recycle();

            JSObject item = new JSObject();
            item.put("data", "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
            item.put("fullWidth", w);
            item.put("fullHeight", h);
            if (hasPlace) {
                JSObject loc = new JSObject();
                loc.put("latitude", lat);
                loc.put("longitude", lng);
                item.put("location", loc);
            }
            return item;
        } catch (Exception e) {
            return null;
        }
    }
}
