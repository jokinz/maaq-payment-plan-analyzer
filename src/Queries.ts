import { excelDateToFormattedDate } from './Utils'
import { queryData } from './components/PlanDePagoAdv'

export const getDataQuery = (operationNumber: number): string => {
  return `
  SELECT SUM(FLD_COL_AMOR), NUM_CUOTAS = COUNT(1) FROM
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
  updateNumber: number,
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
