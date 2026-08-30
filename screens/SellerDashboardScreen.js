import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { COLORS, FONT_SIZES } from "../constants/colors";
import { supabase } from "../supabase";
import { notify } from "../notify";

export default function SellerDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null); // null = adding new
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImages, setProductImages] = useState([]); // [{ uri, base64 }] for new uploads
  const [existingImageUrls, setExistingImageUrls] = useState([]); // already-uploaded URLs, kept on edit
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  const [orders, setOrders] = useState([]);

  const loadSeller = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("sellers").select("*").eq("user_id", user.id).maybeSingle();

    if (!error && data) {
      setSeller(data);
      setShopName(data.shop_name || "");
      setOwnerName(data.owner_name || "");
      setLicenseNumber(data.license_number || "");
      setPhone(data.phone || "");
      setVillage(data.village || "");
      setDistrict(data.district || "");

      // Load this seller's products
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", data.id)
        .order("created_at", { ascending: false });
      setProducts(prods || []);

      // Load orders for this seller
      const { data: sellerOrders } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("seller_id", data.id)
        .order("created_at", { ascending: false });
      setOrders(sellerOrders || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSeller();
  }, [loadSeller]);

  const registerShop = async () => {
    if (!shopName.trim()) {
      Alert.alert("Missing info", "Please enter your shop name.");
      return;
    }
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("sellers").insert([
      {
        user_id: user.id,
        shop_name: shopName,
        owner_name: ownerName,
        license_number: licenseNumber,
        phone,
        village,
        district,
        is_approved: false,
      },
    ]);

    setSaving(false);

    if (error) {
      Alert.alert("Could not register", error.message);
    } else {
      Alert.alert(
        "Shop registered",
        "Your shop has been submitted for review. In this demo, approval is manual — contact the app admin to get approved and start selling."
      );
      loadSeller();
    }
  };

  const MAX_IMAGES = 6;

  const pickProductImage = async () => {
    if (productImages.length >= MAX_IMAGES) {
      Alert.alert("Limit reached", `You can add up to ${MAX_IMAGES} photos per product.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - productImages.length,
    });

    if (!picked.canceled) {
      const newImages = picked.assets.map((a) => ({ uri: a.uri, base64: a.base64 }));
      setProductImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeProductImage = (index) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const startEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductName(product.name || "");
    setProductCategory(product.category || "");
    setProductPrice(String(product.price ?? ""));
    setProductStock(String(product.stock ?? ""));
    setProductDescription(product.description || "");
    setExistingImageUrls(product.images && product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : []);
    setProductImages([]);
    setShowProductForm(true);
  };

  const cancelForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductName("");
    setProductCategory("");
    setProductPrice("");
    setProductStock("");
    setProductDescription("");
    setProductImages([]);
    setExistingImageUrls([]);
  };

  const addProduct = async () => {
    if (!productName.trim() || !productPrice.trim()) {
      Alert.alert("Missing info", "Please enter at least product name and price.");
      return;
    }
    setSavingProduct(true);

    const newlyUploadedUrls = [];

    if (productImages.length > 0) {
      setUploadingImage(true);

      for (let i = 0; i < productImages.length; i++) {
        const fileName = `${seller.id}/${Date.now()}_${i}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, decode(productImages[i].base64), { contentType: "image/jpeg" });

        if (uploadError) {
          setUploadingImage(false);
          setSavingProduct(false);
          Alert.alert("Could not upload image", `Photo ${i + 1}: ${uploadError.message}`);
          return;
        }

        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        newlyUploadedUrls.push(publicUrlData.publicUrl);
      }

      setUploadingImage(false);
    }

    // Combine any kept existing photos (when editing) with newly uploaded ones
    const finalImages = [...existingImageUrls, ...newlyUploadedUrls];

    const payload = {
      name: productName,
      category: productCategory,
      price: parseFloat(productPrice) || 0,
      stock: parseInt(productStock) || 0,
      description: productDescription,
      image_url: finalImages[0] || null,
      images: finalImages,
    };

    const { error } = editingProductId
      ? await supabase.from("products").update(payload).eq("id", editingProductId)
      : await supabase.from("products").insert([{ ...payload, seller_id: seller.id }]);

    setSavingProduct(false);

    if (error) {
      Alert.alert(editingProductId ? "Could not update product" : "Could not add product", error.message);
      return;
    }

    cancelForm();
    loadSeller();
  };

  const deleteProduct = async (id) => {
    Alert.alert("Delete product?", "This will remove it from the marketplace permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("products").delete().eq("id", id);
          if (!error) setProducts((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const order = orders.find((o) => o.id === orderId);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (!error) {
      if (order?.user_id) {
        notify(
          order.user_id,
          `Order ${newStatus}`,
          `Your order from ${seller.shop_name} is now: ${newStatus}.`
        );
      }
      loadSeller();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primaryDeepGreen} />
      </View>
    );
  }

  // Not registered yet — show registration form
  if (!seller) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>🏪 Register Your Shop</Text>
        <Text style={styles.subtitle}>
          List your agri-shop and sell products to farmers on Rythu360. Selling regulated products like
          pesticides requires a valid license — shops are reviewed before approval.
        </Text>

        <Text style={styles.label}>Shop Name *</Text>
        <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="e.g. Sri Ganesh Agro Center" />

        <Text style={styles.label}>Owner Name</Text>
        <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="Your name" />

        <Text style={styles.label}>License Number</Text>
        <TextInput
          style={styles.input}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="Insecticide/seed license number, if applicable"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit number" />

        <Text style={styles.label}>Village</Text>
        <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholder="e.g. Yerraguntla" />

        <Text style={styles.label}>District</Text>
        <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="e.g. YSR Kadapa" />

        <TouchableOpacity style={styles.button} onPress={registerShop} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Registering..." : "Register Shop"}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Registered but not yet approved
  if (!seller.is_approved) {
    return (
      <View style={[styles.container, styles.center, { padding: 20 }]}>
        <Text style={styles.title}>⏳ Pending Approval</Text>
        <Text style={styles.subtitle}>
          Your shop "{seller.shop_name}" has been submitted and is awaiting admin approval. In this demo version,
          approval is done manually — check back later, or contact the app administrator.
        </Text>
      </View>
    );
  }

  // Approved seller — show dashboard
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>🏪 {seller.shop_name}</Text>
      <Text style={styles.subtitle}>✅ Approved seller</Text>

      <TouchableOpacity
        style={styles.addToggle}
        onPress={() => (showProductForm ? cancelForm() : setShowProductForm(true))}
      >
        <Text style={styles.addToggleText}>{showProductForm ? "Cancel" : "+ Add a Product"}</Text>
      </TouchableOpacity>

      {showProductForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingProductId ? "Edit Product" : "New Product"}</Text>

          <Text style={styles.label}>Product Name</Text>
          <TextInput style={styles.input} value={productName} onChangeText={setProductName} placeholder="e.g. NPK Fertilizer 50kg" />

          <Text style={styles.label}>Category</Text>
          <TextInput style={styles.input} value={productCategory} onChangeText={setProductCategory} placeholder="e.g. Fertilizer, Seeds, Tools" />

          <Text style={styles.label}>Price (₹)</Text>
          <TextInput style={styles.input} value={productPrice} onChangeText={setProductPrice} keyboardType="numeric" placeholder="e.g. 850" />

          <Text style={styles.label}>Stock quantity</Text>
          <TextInput style={styles.input} value={productStock} onChangeText={setProductStock} keyboardType="numeric" placeholder="e.g. 20" />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            value={productDescription}
            onChangeText={setProductDescription}
            multiline
            placeholder="Brief details about the product"
          />

          <Text style={styles.label}>
            Product Photos ({existingImageUrls.length + productImages.length}/{MAX_IMAGES})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {existingImageUrls.map((url, index) => (
              <View key={`existing-${index}`} style={styles.thumbWrapper}>
                <Image source={{ uri: url }} style={styles.thumbImage} />
                <TouchableOpacity style={styles.thumbRemove} onPress={() => removeExistingImage(index)}>
                  <Text style={styles.thumbRemoveText}>✕</Text>
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.thumbMainBadge}>
                    <Text style={styles.thumbMainBadgeText}>Main</Text>
                  </View>
                )}
              </View>
            ))}

            {productImages.map((img, index) => (
              <View key={`new-${index}`} style={styles.thumbWrapper}>
                <Image source={{ uri: img.uri }} style={styles.thumbImage} />
                <TouchableOpacity style={styles.thumbRemove} onPress={() => removeProductImage(index)}>
                  <Text style={styles.thumbRemoveText}>✕</Text>
                </TouchableOpacity>
                {existingImageUrls.length === 0 && index === 0 && (
                  <View style={styles.thumbMainBadge}>
                    <Text style={styles.thumbMainBadgeText}>Main</Text>
                  </View>
                )}
              </View>
            ))}

            {existingImageUrls.length + productImages.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.addThumbButton} onPress={pickProductImage}>
                <Text style={styles.addThumbButtonText}>+ Add{"\n"}Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text style={styles.helperText}>
            First photo is used as the main thumbnail. Add multiple angles/close-ups, like a real product listing.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={addProduct}
            disabled={savingProduct || uploadingImage}
          >
            <Text style={styles.buttonText}>
              {uploadingImage
                ? "Uploading photos..."
                : savingProduct
                ? "Saving..."
                : editingProductId
                ? "Update Product"
                : "Save Product"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Your Products ({products.length})</Text>
      {products.map((p) => (
        <View key={p.id} style={styles.productRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{p.name}</Text>
            <Text style={styles.productMeta}>
              ₹{p.price} • {p.stock} in stock
            </Text>
          </View>
          <TouchableOpacity onPress={() => startEditProduct(p)} style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteProduct(p.id)}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Incoming Orders ({orders.length})</Text>
      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <Text style={styles.orderStatus}>Status: {order.status}</Text>
          {order.order_items?.map((oi) => (
            <Text key={oi.id} style={styles.orderItem}>
              {oi.quantity} × {oi.product_name}
            </Text>
          ))}
          <Text style={styles.orderTotal}>Total: ₹{order.total}</Text>
          <Text style={styles.orderAddress}>📍 {order.delivery_address}</Text>
          <Text style={styles.orderPhone}>📞 {order.delivery_phone}</Text>

          <View style={styles.statusButtons}>
            {["Seller Accepted", "Preparing", "Out for Delivery", "Delivered", "Cancelled"].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.statusPill, order.status === status && styles.statusPillActive]}
                onPress={() => updateOrderStatus(order.id, status)}
              >
                <Text style={[styles.statusPillText, order.status === status && styles.statusPillTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  center: { justifyContent: "center", alignItems: "center" },
  title: { fontSize: FONT_SIZES.h1, fontWeight: "700", color: COLORS.primaryDeepGreen },
  subtitle: { fontSize: FONT_SIZES.small, color: COLORS.gray, marginTop: 4, marginBottom: 20, lineHeight: 18 },
  label: { fontSize: FONT_SIZES.small, color: COLORS.darkGreenText, marginTop: 12, marginBottom: 4, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FONT_SIZES.body,
  },
  helperText: { color: COLORS.gray, fontSize: 11, marginTop: 4, fontStyle: "italic" },
  imagePicker: {
    height: 140,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.lightGreenCard,
    borderStyle: "dashed",
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 4,
  },
  imagePickerText: { color: COLORS.gray, fontSize: FONT_SIZES.small },
  imagePreview: { width: "100%", height: "100%" },
  thumbWrapper: { position: "relative", marginRight: 10 },
  thumbImage: { width: 90, height: 90, borderRadius: 10, backgroundColor: COLORS.lightGreenCard },
  thumbRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#B3261E",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbRemoveText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  thumbMainBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  thumbMainBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
  addThumbButton: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.lightGreenCard,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addThumbButtonText: { color: COLORS.primaryDeepGreen, fontSize: 11, fontWeight: "700", textAlign: "center" },
  button: {
    backgroundColor: COLORS.primaryDeepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: FONT_SIZES.body },
  addToggle: { backgroundColor: COLORS.harvestGold, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginBottom: 10 },
  addToggleText: { color: COLORS.darkGreenText, fontWeight: "700", fontSize: FONT_SIZES.small },
  form: { backgroundColor: COLORS.lightGreenCard, borderRadius: 14, padding: 16, marginBottom: 10 },
  sectionTitle: { fontSize: FONT_SIZES.body, fontWeight: "700", color: COLORS.primaryDeepGreen, marginTop: 24, marginBottom: 10 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  productName: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.small },
  productMeta: { color: COLORS.gray, fontSize: 11, marginTop: 2 },
  deleteText: { color: COLORS.gray, fontSize: 16, paddingHorizontal: 8 },
  formTitle: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.body, marginBottom: 6 },
  editButton: {
    backgroundColor: COLORS.lightGreenCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  editText: { color: COLORS.primaryDeepGreen, fontSize: 12, fontWeight: "600" },
  orderCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGreenCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  orderStatus: { fontWeight: "700", color: COLORS.primaryDeepGreen, fontSize: FONT_SIZES.small, marginBottom: 6 },
  orderItem: { color: COLORS.darkGreenText, fontSize: 12, marginBottom: 2 },
  orderTotal: { fontWeight: "700", color: COLORS.darkGreenText, fontSize: FONT_SIZES.small, marginTop: 6 },
  orderAddress: { color: COLORS.gray, fontSize: 11, marginTop: 4 },
  orderPhone: { color: COLORS.gray, fontSize: 11, marginTop: 2 },
  statusButtons: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  statusPill: { borderWidth: 1, borderColor: COLORS.lightGreenCard, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillActive: { backgroundColor: COLORS.primaryDeepGreen, borderColor: COLORS.primaryDeepGreen },
  statusPillText: { fontSize: 10, color: COLORS.darkGreenText },
  statusPillTextActive: { color: COLORS.white, fontWeight: "700" },
});