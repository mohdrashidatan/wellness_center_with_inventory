import ItemCard from "@/components/pos/ItemCard";
import PackageCard from "@/components/pos/PackageCard";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

//useEffect
import { useEffect, useState } from "react";

//service
import { productsService } from "@/services/productsService";
import { packageService } from "@/services/packageService";
import { Package } from "lucide-react";

export default function Inventory({ selectedData, setSelectedData, customerId }) {
  const [inventoryType, setInventoryType] = useState("Service");
  const [dataProduct, setDataProduct] = useState([]);
  const [dataProductOriginal, setDataProductOriginal] = useState([]);
  const [listDataPackage, setListDataPackage] = useState([]);
  const [listDataPackageOriginal, setListDataPackageOriginal] = useState([]);
  const [packageShow, setPackageShow] = useState(false);
  const [packageCusFlag, setPackageCusFlag] = useState(false);

  const handleFilter = async (filter) => {
    setPackageCusFlag(false);
    if (filter == "Package") {
      setInventoryType(filter);
      setPackageShow(true);
      const dataPackage = await packageService.getPackage();
      setListDataPackage(dataPackage);
      setListDataPackageOriginal(dataPackage);
    } else if (filter == "PackageCus") {
      setPackageCusFlag(true);
      setInventoryType(filter);
      setPackageShow(true);
      const dataPackage = await packageService.getCusPackage(customerId);
      setListDataPackage(dataPackage);
      setListDataPackageOriginal(dataPackage);
    } else {
      setPackageShow(false);
      setInventoryType(filter);
      const dataProducts = dataProductOriginal.filter((item) => item.productcat === filter);

      setDataProduct(dataProducts);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      const data = await productsService.getProducts();

      let dataProducts;
      if (inventoryType) {
        dataProducts = data.filter((item) => item.productcat === inventoryType);
      } else {
        dataProducts = data;
      }
      setDataProduct(dataProducts);
      setDataProductOriginal(data);
    };

    fetch();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;

    if (!packageShow) {
      const filtered = dataProductOriginal.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()) && item.productcat === inventoryType);
      setDataProduct(filtered);
    } else {
      console.log("pacori", listDataPackageOriginal);
      const filtered = listDataPackageOriginal.filter((item) => item.packagedesc.toLowerCase().includes(value.toLowerCase()));
      console.log("filer", filtered);

      setListDataPackage(filtered);
    }
  };

  return (
    <div className='border-2 border-purple-900/30 shadow-md rounded-2xl col-span-2 gap-2 p-2 bg-purple-900/5'>
      <Input className=' bg-white h-10' placeholder='Search' onChange={handleSearch} />
      <div className={`w-full lg:grid ${customerId ? "grid-cols-4" : "grid-cols-2"} gap-2 my-5 space-y-2 lg:space-y-0 `}>
        <Card className={`p-3 hover:scale-105 transition-transform duration-300 ${inventoryType == "Service" && "bg-purple-100/90  border border-purple-950"} cursor-pointer`} onClick={() => handleFilter("Service")}>
          <p>Service</p>
        </Card>
        <Card className={`p-3 hover:scale-105 transition-transform duration-300 ${inventoryType == "Product" && "bg-purple-100/90 border border-purple-950"} cursor-pointer`} onClick={() => handleFilter("Product")}>
          <p>Product</p>
        </Card>

        {customerId && (
          <>
            <Card className={`p-3 hover:scale-105 transition-transform duration-300 ${inventoryType == "Package" && "bg-purple-100/90  border border-purple-950"} cursor-pointer`} onClick={() => handleFilter("Package")}>
              <p>Package</p>
            </Card>
            <Card className={`p-3 hover:scale-105 transition-transform duration-300 ${inventoryType == "PackageCus" && "bg-blue-100/90  border border-blue-700"} cursor-pointer`} onClick={() => handleFilter("PackageCus")}>
              <p>Package Cus</p>
            </Card>
          </>
        )}
      </div>

      {!packageShow ? (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 p-2'>
          {dataProduct.map((item, index) => (
            <ItemCard
                key={index}
                name={item.name}
                price={item.unitprice}
                type={item.productcat}
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                productid={item.productid}
                isVariantEnabled={!!item.is_variant_enabled}
              />
          ))}
        </div>
      ) : (
        <div className='grid lg:grid-cols-3 gap-3'>
          {listDataPackage.map((item, index) => (
            <PackageCard key={index} item={item} index={index} setSelectedData={setSelectedData} packageCusFlag={packageCusFlag} />
          ))}

          {!listDataPackage.length > 0 && <p className=''>No Package</p>}
        </div>
      )}
    </div>
  );
}
