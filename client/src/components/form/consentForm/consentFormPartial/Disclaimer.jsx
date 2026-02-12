export default function Disclaimer({ extended, personalData, setExtended, Button }) {
  return (
    <div className='grid '>
      {!extended ? (
        <p className='text-sm mb-4 text-justify'>
          By signing this consent agreement, I <span className='font-bold'>{personalData[0]?.name}</span> acknowledge that I am receiving therapy from Prife International...
        </p>
      ) : (
        <p className='text-sm mb-4 text-justify'>
          By signing this consent agreement, I <span className='font-bold'>{personalData[0]?.name}</span>, acknowledge that I am receiving therapy from Prife International. I understand and accept that Prife International will not be held responsible for any unforeseen circumstances, including but
          not limited to burns, rashes, peeling of the skin, swelling, or inflammations that may occur following the therapy. I take full responsibility for providing accurate medical information and promptly communicating any concerns or discomfort during the therapy session. I acknowledge that the
          results of the therapy are not guaranteed, and individual experiences may vary. I also acknowledge that I have the right to refuse or discontinue the therapy at any time. By signing below, I confirm my understanding, agreement, and the freedom to make decisions regarding my session. I
          hereby declare my agreement to release the br company from any indemnity that may arise from hereafter.
          <br />
          <br />
          通过签署本同意书，我 <span className='font-bold'>{personalData[0]?.name}</span>，我确认接受 Prife International 的理疗。 我理解并接受 Prife International 将不对任何不可预见的情况
          承担任何责任，这些情况包括但不限于理疗后可能发生的烧伤、皮疹、皮肤脱落、肿胀或炎症。我对提供准确的医疗信息负起全责并在理疗期间及时传达任何的疑虑或不 适感。 我明白不能保证理疗的结果，并且体验感和效果也会因人而异。 我也明白我有权随时拒绝或停止理疗。
          通过在下面签名，我确认我理解、同意以及在自由的情况 下进行理疗。 我特此声明我同意免除公司对此后可能产生的任何赔偿负责。
          <br /> <br /> Dengan menandatangani perjanjian persetujuan ini, saya <span className='font-bold'>{personalData[0]?.name}</span>, mengakui bahawa saya menerima terapi daripada Prife International. Saya faham dan menerima bahawa Prife International tidak akan bertanggungjawab untuk sebarang
          keadaan yang tidak terduga, termasuk tetapi tidak terhad kepada melecur, ruam, pengelupasan kulit, pembengkakan atau keradangan yang mungkin berlaku selepas terapi. Saya bertanggungjawab sepenuhnya untuk memberikan maklumat perubatan yang tepat dan segera memaklumkan sebarang kebimbangan
          atau ketidakselesaan semasa sesi terapi. Saya juga mengakui bahawa hasil terapi tidak dijamin, dan pengalaman individu mungkin berbeza. Saya mengakui bahawa saya berhak untuk menolak atau menghentikan terapi pada bila-bila masa. Dengan menandatangani di bawah, saya mengesahkan pemahaman,
          persetujuan dan kebebasan saya untuk membuat keputusan mengenai sesi saya. Saya dengan ini mengisytiharkan persetujuan saya untuk membebaskan syarikat daripada sebarang indemniti yang mungkin timbul selepas ini.
        </p>
      )}
      <Button variant='ghost' onClick={() => setExtended(!extended)}>
        Shows Full Disclaimer
      </Button>
    </div>
  );
}
