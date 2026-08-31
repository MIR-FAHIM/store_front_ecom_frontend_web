import React from "react";
import { useParams } from "react-router-dom";
import SellerStoreQrPanel from "../../seller_panel/store_qr/SellerStoreQrPanel";

const AdminStoreQrPanel = () => {
  const { storeId } = useParams();
  return <SellerStoreQrPanel storeId={storeId} />;
};

export default AdminStoreQrPanel;
