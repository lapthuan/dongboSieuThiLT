require("dotenv").config();
const { sqlPool, connectSQL } = require("./connect/connect_sqlserver");
const { connectMysql, mysqlConnection } = require("./connect/connect_mysql");
const { connectOracle, executeOracleQuery } = require("./connect/connect_oracle");


connectSQL();
connectMysql();
connectOracle();


function DongBo() {
  //Đồng bộ chinhanh
  //SqlServer
  mysqlConnection.query(`SELECT * FROM chinhanh except 
  SELECT cn.* 
  FROM chinhanh cn 
  JOIN tinh t on t.MaTinh = cn.MaTinh 
  WHERE t.TenTinh = 'Vĩnh Long'`, (selectErr, results) => {

    results.forEach(async (row) => {

      const { MaCN, TenCN, DiaChi, MaTinh } = row;
      const ktcn = `SELECT COUNT(*) AS COUNT FROM chinhanh WHERE MaCN = '${MaCN}'`;
      const sqlCheckResult = await sqlPool.request().query(ktcn);

      if (sqlCheckResult.recordset[0].COUNT == 0) {

        connectSQL();
        const insertQuery = `INSERT INTO chinhanh VALUES ('${MaCN}', N'${TenCN}',N'${DiaChi}', '${MaTinh}')`;

        sqlPool.request().query(insertQuery, (insertErr) => {
          if (insertErr) {
            console.error('Lỗi thêm dữ liệu vào SQL Server:', insertErr);
          } else {
            console.log(`Dữ liệu ${MaCN} đã được đồng bộ về Sql Server`);
          }
        });
      }

    });

  });

  //Oracel
  mysqlConnection.query(`SELECT cn.* 
  FROM chinhanh cn 
  JOIN tinh t on t.MaTinh = cn.MaTinh 
  WHERE t.TenTinh = 'Vĩnh Long'`, (selectErr, results) => {

    results.forEach(async (row) => {
      const { MaCN, TenCN, DiaChi, MaTinh } = row;
      const ktcn = await executeOracleQuery(
        `SELECT COUNT(*) AS COUNT FROM chinhanh WHERE MaCN = :MaCN`,
        [MaCN]
      );

      if (ktcn.rows[0][0] == 0) {

        const insertQuery = "INSERT INTO chinhanh (MaCN, TenCN, DiaChi, MaTinh) VALUES (:1,:2,:3,:4)";

        const resultsOracel = await executeOracleQuery(insertQuery, [
          MaCN, TenCN, DiaChi, MaTinh
        ]);
        console.log(`Dữ liệu ${MaCN} đã được đồng bộ về Oracel`);
      }
    });
  });
  //Đồng bộ sieuthii
  //SqlServer
  mysqlConnection.query(`Select * from sieuthi except SELECT st.* from sieuthi st JOIN chinhanh cn on cn.MaCN = st.MaCN JOIN tinh t on t.MaTinh = cn.MaTinh 
  WHERE t.TenTinh = 'Vĩnh Long'`, (selectErr, results) => {

    results.forEach(async (row) => {

      const { MaST, TenST, DiaChi, SDT, Email, MaCN } = row;
      const ktST = `SELECT COUNT(*) AS COUNT FROM sieuthi WHERE MaST = '${MaST}'`;
      const sqlCheckResult = await sqlPool.request().query(ktST);
      const ktcn = `SELECT COUNT(*) AS COUNT FROM chinhanh WHERE MaCN = '${MaCN}'`;
      const sqlCheckResult2 = await sqlPool.request().query(ktST);
      if (sqlCheckResult2.recordset[0].COUNT > 0) {
        if (sqlCheckResult.recordset[0].COUNT == 0) {

          connectSQL();
          const insertQuery = `INSERT INTO sieuthi VALUES ('${MaST}', N'${TenST}',N'${DiaChi}', '${SDT}','${Email}','${MaCN}')`;

          sqlPool.request().query(insertQuery, (insertErr) => {
            if (insertErr) {
              console.error('Lỗi thêm dữ liệu vào SQL Server:', insertErr);
            } else {
              console.log(`Dữ liệu ${MaST} đã được đồng bộ về Sql Server`);
            }
          });
        }
      } else {
        console.log(`Chi nhánh không tồn tại trong Sql Server, Đồng bộ thất bại`);
      }

    });

  });

  //Oracel
  mysqlConnection.query(`SELECT st.* from sieuthi st JOIN chinhanh cn on cn.MaCN = st.MaCN JOIN tinh t on t.MaTinh = cn.MaTinh 
  WHERE t.TenTinh = 'Vĩnh Long'`, (selectErr, results) => {

    results.forEach(async (row) => {
      const { MaST, TenST, DiaChi, SDT, Email, MaCN } = row;
      const ktst = await executeOracleQuery(
        `SELECT COUNT(*) AS COUNT FROM sieuthi WHERE MaST = :MaST`,
        [MaST]
      );
      const ktcn = await executeOracleQuery(
        `SELECT COUNT(*) AS COUNT FROM chinhanh WHERE MaCN = :MaCN`,
        [MaCN]
      );
      if (ktcn.rows[0][0] > 0) {
        if (ktst.rows[0][0] == 0) {
          const insertQuery = "INSERT INTO sieuthi (MaST, TenST, DiaChi, SDT, Email, MaCN) VALUES (:1,:2,:3,:4,:5,:6)";
          const resultsOracel = await executeOracleQuery(insertQuery, [
            MaST, TenST, DiaChi, SDT, Email, MaCN
          ]);
          console.log(`Dữ liệu ${MaST} đã được đồng bộ về Oracel`);
        }
      } else {
        console.log(`Chi nhánh không tồn tại trong Oracel, Đồng bộ thất bại`);
      }
    });
  });


}
setInterval(DongBo, 10000);

