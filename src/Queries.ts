import { excelDateToFormattedDate } from './Utils'
import { queryData } from './components/PlanDePagoAdv'

export const getDataQuery = (operationNumber: number): string => {
  return `
  SELECT NUM_CUOTAS = COUNT(1), SUM(FLD_COL_AMOR) FROM
  SCA_HIPOTEC..COL 
  WHERE FLD_COL_OPER = ${operationNumber} 

  SELECT * FROM SCA_ADMINI..TCO WHERE FLD_TCO_OPER =
  ${operationNumber}`
}

export const updateQuery = (operationNumber: number): string => {
  return `use sca_hipotec
    GO
  
    DECLARE @FLD_COL_OPER	INT
    ,		@FLD_FIN_FPDE	DATETIME
    ,		@num_liq		int
  
          SET @FLD_COL_OPER = ${operationNumber}
  
          SELECT @FLD_FIN_FPDE = FLD_FIN_FPDE FROM SCA_HIPOTEC..FIN WHERE FLD_FIN_OPER = @FLD_COL_OPER 
          
          EXEC SCA_HIPOTEC..SVC_PRO_CONT2 @FLD_COL_OPER, 0, 0, '1', @FLD_FIN_FPDE, '', '', @num_liq Output
  
    UPDATE	SCA_HIPOTEC..SOL
      SET	FLD_SOL_ESOL	= '3',
        FLD_SOL_RES		= '3'
    WHERE	FLD_SOL_OPER	= @FLD_COL_OPER
  
    UPDATE SCA_HIPOTEC..FIN
      SET FLD_FIN_EST = '3'
    WHERE FLD_FIN_OPER = @FLD_COL_OPER
  
    UPDATE SCA_HIPOTEC..TRC 
    SET FLD_TRC_FPRO = '19900101'
    WHERE FLD_TRC_OPER = @FLD_COL_OPER AND
        FLD_TRC_NLIQ != @NUM_LIQ AND
        FLD_TRC_FPRO = 0 AND
        FLD_TRC_ASN IN ('SCA1','SCA26' /*OTORGAMIENTOS*/,'SCA5'/*REVERSA OTORGAMIENTO*/,'SCA33'/*OTORGAMIENTO DE RECUPERO*/)
  
    /*RESPALDA DATOS DE TABLA FIN Y COL EN BASE DE DATOS HISTORICO*/
    INSERT INTO SCA_HISTORICO..THIS_FIN
    (THIS_FIN_OPER, THIS_FIN_MOS, THIS_FIN_FOTO, THIS_FIN_FPDE, THIS_FIN_PLA, THIS_FIN_GNOT, THIS_FIN_MOT, THIS_FIN_INST, THIS_FIN_ICAP, THIS_FIN_MIMP, THIS_FIN_NLIQ)
    SELECT FLD_FIN_OPER, FLD_FIN_MOS, FLD_FIN_FOTO, FLD_FIN_FPDE, FLD_FIN_PLA, FLD_FIN_GNOT, FLD_FIN_MOT, FLD_FIN_INST, FLD_FIN_ICAP, FLD_FIN_MIMP, @num_liq
    FROM SCA_HIPOTEC..FIN
    WHERE FLD_FIN_OPER=@FLD_COL_OPER
  
    INSERT INTO SCA_HISTORICO..THIS_COL
    (THIS_COL_OPER, THIS_COL_FVEN, THIS_COL_AMOR, THIS_COL_NCU, THIS_COL_INT, THIS_COL_CUO, THIS_COL_ECLP, THIS_COL_NDOC, THIS_COL_SEGU, THIS_COL_NLIQ)
    SELECT FLD_COL_OPER, FLD_COL_FVEN, FLD_COL_AMOR, FLD_COL_NCU, FLD_COL_INT, FLD_COL_CUO , FLD_COL_ECLP, FLD_COL_NDOC, FLD_COL_SEGU, @num_liq
    FROM SCA_HIPOTEC..COL
    WHERE FLD_COL_OPER=@FLD_COL_OPER
  
    --- PARA LOS CASOS DE CUOTAS QUE ENTRAN VENCIDAS
    UPDATE SCA_ADMINI..TCO
    SET FLD_TCO_FPDI = (SELECT MIN(FLD_COL_FVEN) FROM SCA_HIPOTEC..COL WHERE FLD_COL_OPER = @FLD_COL_OPER )
    WHERE FLD_TCO_OPER = @FLD_COL_OPER`
}

export const unityInsertQuery = (
  operationNumber: number,
  { tipo, nroCuota, fecha, capital, intereses, saldo }: queryData
): string => {
  const cuota = intereses + capital
  const formattedDate: string = excelDateToFormattedDate(fecha)
  if (intereses === undefined) {
    intereses = 0
  }
  if (saldo === undefined) {
    saldo = 0
  }
  const formatNumber = (value: number): string => {
    const stringedTruncedNumber = Math.round(value).toString()
    if (stringedTruncedNumber.length >= 6) {
      return `${stringedTruncedNumber}\t`
    }
    if (stringedTruncedNumber.length >= 3) {
      return `${stringedTruncedNumber}\t\t`
    }
    if (stringedTruncedNumber.length >= 1) {
      return `${stringedTruncedNumber}\t\t\t`
    }
    return `${stringedTruncedNumber}\t\t\t`
  }
  const formattedCuota = formatNumber(cuota)
  const formattedCapital = formatNumber(capital)
  const formattedIntereses = formatNumber(intereses)
  const formattedSaldo = formatNumber(saldo)
  let result = `insert into PAYMENTS_PLAN_SFCO(operacion, tipo, Num_Cuota, Fec_Venc, Cuota, Amortizacion, Interes, Seguros, Saldo_Insoluto) values(${operationNumber}, ${tipo}, ${nroCuota},\t'${formattedDate}', ${formattedCuota}, ${formattedCapital}, ${formattedIntereses}, 0, ${formattedSaldo});\n`

  return result
}

export const updateOperationPaymentsQuery = (
  operationNumber: number,
  updateNumber: number | string,
  paymentNumber: number
): string => {
  const query: string = `UPDATE SCA_HIPOTEC..COL SET FLD_COL_NDOC = '${updateNumber}' WHERE FLD_COL_OPER = ${operationNumber} AND FLD_COL_NCU = ${paymentNumber};\n`
  return query
}

export const paymentPlansBackupQuery = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  const query: string = `use BT_SFCO
  GO
  
  SELECT * 
  INTO COL_${year}${month}${day}
  FROM SCA_HIPOTEC..COL`
  return query
}

export const goodsBackupQuery = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  const query: string = `use BT_SFCO
  GO
  
  SELECT * 
  INTO GAR_BKP${year}${month}${day}
  FROM SCA_ADMINI..GAR`
  return query
}

export const transferGoodsQuery = (
  sourceOperation: number,
  targetOperation: number,
  goodsList: string[],
  includeStatus: 'include' | 'exclude'
): string => {
  if (targetOperation === sourceOperation) {
    return ''
  }
  let query = `INSERT INTO SCA_ADMINI..GAR
       SELECT ${targetOperation} , FLD_GAR_NCHASIS,FLD_GAR_NMOT,FLD_GAR_MODB,FLD_GAR_TIPB,FLD_GAR_ESTB,FLD_GAR_PRD,FLD_GAR_SUC,FLD_GAR_MON
,FLD_GAR_ACO,FLD_GAR_CAL,FLD_GAR_CIU,FLD_GAR_COM,FLD_GAR_REG,FLD_GAR_FTAS,FLD_GAR_HIP,FLD_GAR_IBRA,FLD_GAR_IBRF,FLD_GAR_IBRN
,FLD_GAR_NBO,FLD_GAR_NOT,FLD_GAR_NUE,FLD_GAR_ROLC1,FLD_GAR_ROLC2,FLD_GAR_SUCC,FLD_GAR_SUT,FLD_GAR_TGAR,FLD_GAR_TIB,FLD_GAR_VAT
,FLD_GAR_VCO,FLD_GAR_VSIM,FLD_GAR_TIPO,FLD_GAR_MVEH,FLD_GAR_MODV, FLD_GAR_FEJE,FLD_GAR_TBI,FLD_GAR_TIC,FLD_GAR_DES
,FLD_GAR_IBRC,FLD_GAR_TBIEN,FLD_GAR_MODELO,FLD_GAR_FIBR,FLD_GAR_BLOC,FLD_GAR_DEPTO,FLD_GAR_CBR,FLD_GAR_IBRA2,FLD_GAR_DIRN
,FLD_GAR_CPOS,FLD_GAR_VMKD,FLD_GAR_POLI,FLD_GAR_MONB,FLD_GAR_FDEP,FLD_GAR_TCOMB,FLD_GAR_EASEG,FLD_GAR_NUMFAC,FLD_GAR_FEMFAC,FLD_GAR_MTOFAC
       ,FLD_GAR_OTGR,FLD_GAR_BENL,FLD_GAR_ITEM 
       FROM SCA_ADMINI..GAR INNER JOIN SCA_ADMINI..TCO ON FLD_GAR_OPER = FLD_TCO_OPER
       WHERE FLD_GAR_OPER IN(${sourceOperation})`
  if (goodsList.length > 0) {
    query += ` AND LTRIM(RTRIM(FLD_GAR_BLOC)) ${includeStatus === 'exclude' ? 'NOT ' : ''} IN (${goodsList.map(
      (item) => `'${item}'`
    )}) ORDER BY  FLD_GAR_BLOC`
  }

  return query
}

export const checkDicomQuery = (
  contractList: number[],
  paymentList: number[],
  documentList: number[]
): string => {
  let lines: string[] = []

  contractList.forEach((contract, index) =>
    lines.push(
      `SELECT * FROM SCA_HIPOTEC..COL WHERE FLD_COL_OPER = ${contract} AND FLD_COL_NCU = ${paymentList[index]} AND FLD_COL_NDOC = '${documentList[index]}'\n`
    )
  )

  const query: string = lines.join('UNION ')
  return query
}

export const insertDicomQuery = (documentList: number[]): string => {
  let query: string = `USE SCA_HIPOTEC\nGO\n`
  documentList.forEach((document) => {
    query += `INSERT INTO FOLIO_DIC(folio) VALUES ('${document}');\n`
  })

  return query
}
