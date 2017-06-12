<xsl:stylesheet version="1.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:dp="http://www.datapower.com/extensions" 
	extension-element-prefixes="dp" exclude-result-prefixes="dp">


  <!-- the dir _common is pre-populated -->
  <xsl:template match="/">
    <processor-transformed-input>
      <xsl:copy-of select="."/>
      <newField>added by request processor</newField>
    </processor-transformed-input>
  </xsl:template>

</xsl:stylesheet>